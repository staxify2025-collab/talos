/**
 * Cache Manager — Explicit Context Caching for Talos
 *
 * Manages per-tenant cached contexts so the model doesn't re-process
 * the tenant's static UI screenshot on every request. Provides a 90%
 * token discount on cached input tokens with Gemini 3 Flash.
 */

import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'talos-saas';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-3-flash-preview';
const CACHE_TTL = '3600s'; // 1 hour

const db = admin.firestore();

// Singleton GenAI client
let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION,
    });
  }
  return _client;
}

export interface CacheMetadata {
  cachedContentName: string;
  schemaId: string;
  tenantId: string;
  model: string;
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  tokenCount: number;
}

/**
 * Get or create a cached context for a tenant's schema.
 *
 * The cache contains:
 *  - The tenant's target application screenshot (static between requests)
 *  - The field mapping schema (changes infrequently)
 *  - The system instruction prompt
 *
 * This means each new document only sends the NEW source document,
 * giving us the "warm start" effect.
 */
export async function getOrCreateCache(
  tenantId: string,
  schemaId: string,
  targetScreenshotBase64: string,
  systemInstruction: string,
  mappingDescription: string
): Promise<{ cacheName: string; isNew: boolean }> {
  const cacheRef = db
    .collection('tenants')
    .doc(tenantId)
    .collection('cache_metadata')
    .doc(schemaId);

  // 1. Check for existing cache
  const existing = await cacheRef.get();
  if (existing.exists) {
    const meta = existing.data() as CacheMetadata;
    const now = admin.firestore.Timestamp.now();

    // Check TTL — is the cache still valid?
    if (meta.expiresAt.toMillis() > now.toMillis()) {
      // Verify the cache still exists on the Vertex AI side
      try {
        const client = getClient();
        const cachedContent = await client.caches.get({ name: meta.cachedContentName });
        if (cachedContent && cachedContent.name) {
          console.log(`[Cache HIT] Reusing cache for tenant=${tenantId} schema=${schemaId}`);
          return { cacheName: meta.cachedContentName, isNew: false };
        }
      } catch {
        // Cache was deleted on the server side — fall through to create new
        console.log(`[Cache MISS] Server-side cache expired for tenant=${tenantId}, recreating`);
      }
    } else {
      console.log(`[Cache EXPIRED] TTL exceeded for tenant=${tenantId} schema=${schemaId}`);
    }
  }

  // 2. Create new cache
  console.log(`[Cache CREATE] Creating new cache for tenant=${tenantId} schema=${schemaId}`);
  const client = getClient();

  const contentCache = await client.caches.create({
    model: MODEL_ID,
    config: {
      displayName: `talos-${tenantId}-${schemaId}`,
      systemInstruction: systemInstruction,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `## Field Mapping Schema\n${mappingDescription}\n\nThe image below is the TARGET APPLICATION screenshot. This is the software where data must be entered. Memorize the layout, labels, and positions of all input fields.`,
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: targetScreenshotBase64,
              },
            },
          ],
        },
      ],
      ttl: CACHE_TTL,
    },
  });

  const cacheName = contentCache.name!;
  const tokenCount = contentCache.usageMetadata?.totalTokenCount || 0;

  // 3. Save metadata to Firestore
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + 3600 * 1000 // 1 hour
  );

  const metadata: CacheMetadata = {
    cachedContentName: cacheName,
    schemaId,
    tenantId,
    model: MODEL_ID,
    createdAt: now,
    expiresAt,
    tokenCount,
  };

  await cacheRef.set(metadata);
  console.log(`[Cache CREATED] name=${cacheName} tokens=${tokenCount}`);

  return { cacheName, isNew: true };
}

/**
 * Invalidate (delete) a tenant's cache.
 * Call this when a tenant updates their screenshot or field mapping schema.
 */
export async function invalidateCache(tenantId: string, schemaId?: string): Promise<void> {
  const client = getClient();

  if (schemaId) {
    // Delete specific schema cache
    const cacheRef = db
      .collection('tenants')
      .doc(tenantId)
      .collection('cache_metadata')
      .doc(schemaId);

    const doc = await cacheRef.get();
    if (doc.exists) {
      const meta = doc.data() as CacheMetadata;
      try {
        await client.caches.delete({ name: meta.cachedContentName });
      } catch {
        // Cache may already be expired
      }
      await cacheRef.delete();
    }
  } else {
    // Delete ALL caches for this tenant
    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('cache_metadata')
      .get();

    for (const doc of snapshot.docs) {
      const meta = doc.data() as CacheMetadata;
      try {
        await client.caches.delete({ name: meta.cachedContentName });
      } catch {
        // Ignore
      }
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  console.log(`[Cache INVALIDATED] tenant=${tenantId} schema=${schemaId || 'ALL'}`);
}
