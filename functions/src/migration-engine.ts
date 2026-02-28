import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { getOrCreateCache } from './cache-manager';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'talos-saas';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-3-flash-preview';

interface MigrationRequest {
  tenantId: string;
  sessionId: string;
  recordID: string;
  sourceScreenshotBase64: string;
  targetScreenshotBase64: string;
  schemaId: string;
}

const MIGRATION_SYSTEM_INSTRUCTION = `You are the Talos Migration Engine.
You specialize in "Source-to-Destination" data migration between different software interfaces.

OBJECTIVE:
Analyze two screenshots: one from a "Source Application" (where data currently exists) and one from a "Target Application" (where data must be moved).

YOUR TASK:
1. EXTRACT FROM SOURCE: Identify the record view in the Source screenshot. Extract every field value.
2. MAP TO TARGET: Locate the corresponding input fields in the Target screenshot.
3. PROVIDE COORDINATES: Return pixel-precise bounding boxes [ymin, xmin, ymax, xmax] for each target input field.

OUTPUT FORMAT (strict JSON):
{
  "sourceData": {
    "fieldName": "value"
  },
  "actions": [
    {
      "field": "fieldName",
      "value": "value",
      "boundingBox": { "ymin": 100, "xmin": 200, "ymax": 120, "xmax": 400 },
      "confidence": 0.95
    }
  ]
}

RULES:
- Be exact with coordinates — the center of your box will be clicked.
- If a target field is not visible, return boundingBox values of -1.
- Only return data that is visible in the Source screenshot.`;

export async function processMigrationStep(req: MigrationRequest) {
  const db = admin.firestore();
  
  try {
    const client = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION,
    });

    // 1. Fetch Schema for Mapping Description
    const schemaDoc = await db.doc(`tenants/${req.tenantId}/field_mapping_schemas/${req.schemaId}`).get();
    const schemaData = schemaDoc.data();
    const mappingDescription = schemaData?.mappings 
      ? JSON.stringify(schemaData.mappings, null, 2)
      : "No schema mappings defined.";

    // 2. Get or Create Cache for this Target Surface & Schema
    const { cacheName, isNew } = await getOrCreateCache(
      req.tenantId,
      req.schemaId,
      req.targetScreenshotBase64,
      MIGRATION_SYSTEM_INSTRUCTION,
      mappingDescription
    );

    // 3. Generate Content using Cached Context
    const model = client.getGenerativeModel({ model: MODEL_ID });
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Analyzing record: ${req.recordID} from source application.` },
            { text: `SOURCE APPLICATION SCREENSHOT (NEW DATA):` },
            { inlineData: { mimeType: 'image/png', data: req.sourceScreenshotBase64 } },
          ]
        }
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
      },
      cachedContent: cacheName
    });

    const responseText = result.response.text() || '{}';
    const cleanedJson = responseText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    // 4. Extract Usage Metadata
    const usage = result.response.usageMetadata;
    const usageData = {
      cachedContentTokenCount: usage?.cachedContentTokenCount || 0,
      totalTokenCount: usage?.totalTokenCount || 0,
      promptTokenCount: usage?.promptTokenCount || 0,
      candidatesTokenCount: usage?.candidatesTokenCount || 0,
      thoughtsTokenCount: 0, 
    };

    // Log the job step in Firestore
    const jobRef = db
      .collection('tenants')
      .doc(req.tenantId)
      .collection('migration_sessions')
      .doc(req.sessionId)
      .collection('jobs')
      .doc();

    const jobData = {
      sessionId: req.sessionId,
      tenantId: req.tenantId,
      recordID: req.recordID,
      status: 'completed',
      sourceData: parsed.sourceData,
      mappedActions: parsed.actions,
      isVerified: false,
      usageMetadata: usageData,
      cacheStatus: isNew ? 'CREATED' : 'HIT',
      createdAt: admin.firestore.Timestamp.now(),
      completedAt: admin.firestore.Timestamp.now(),
    };

    await jobRef.set(jobData);

    // 5. Audit Logging for "Migration Proof" Report
    const avgConfidence = parsed.actions.length > 0
      ? parsed.actions.reduce((acc: number, a: { confidence: number }) => acc + a.confidence, 0) / parsed.actions.length
      : 1;

    await db.collection('migration_logs').add({
      tenantId: req.tenantId,
      sessionId: req.sessionId,
      jobId: jobRef.id,
      source_record_id: req.recordID,
      status: 'Success',
      confidence_score: avgConfidence,
      mapping_path: `tenants/${req.tenantId}/field_mapping_schemas/${req.schemaId}`,
      createdAt: admin.firestore.Timestamp.now(),
    });

    // Update session stats
    const tokensSaved = usageData.cachedContentTokenCount;
    await db.doc(`tenants/${req.tenantId}/migration_sessions/${req.sessionId}`).update({
      migratedCount: admin.firestore.FieldValue.increment(1),
      totalTokensSaved: admin.firestore.FieldValue.increment(tokensSaved),
      lastRecordID: req.recordID,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { success: true, jobId: jobRef.id, actions: parsed.actions, cacheStatus: isNew ? 'CREATED' : 'HIT' };
  } catch (err: any) {
    console.error('Migration step error:', err);
    await db.collection('migration_logs').add({
      tenantId: req.tenantId,
      sessionId: req.sessionId,
      source_record_id: req.recordID,
      status: 'Failed',
      error: err instanceof Error ? err.message : String(err),
      createdAt: admin.firestore.Timestamp.now(),
    });
    throw err;
  }
}
