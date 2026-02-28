import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import cors from 'cors';

admin.initializeApp();

import { visionMap, logWebMCPRun } from './vision-mapper';
import { processMigrationStep } from './migration-engine';
import { generateMigrationProof } from './report-generator';
import { invalidateCache } from './cache-manager';
import {
  createTenant,
  listTenants,
  getTenant,
  updateTenant,
  createFieldMappingSchema,
  listFieldMappingSchemas,
  updateFieldMappingSchema,
  deleteFieldMappingSchema,
} from './tenant-management';

const corsHandler = cors({ origin: true });

// ─── Vision Mapping Endpoint (Gemini 3 Flash + Context Caching) ─

export const processVisionMapping = onRequest(
  { memory: '2GiB', timeoutSeconds: 300, region: 'us-central1' },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const {
          tenantId,
          schemaId,
          sourceDocumentBase64,
          sourceDocumentMimeType,
          targetScreenshotBase64,
          executionMode,
          webmcpResult,
        } = req.body;

        // ─── Path A: WebMCP Structured Execution ────────
        // Client already executed via navigator.modelContext.
        // We only log the result for tracking & ROI analysis.
        if (executionMode === 'WEBMCP') {
          if (!tenantId || !schemaId) {
            res.status(400).json({ error: 'Missing required fields: tenantId, schemaId' });
            return;
          }
          await logWebMCPRun(tenantId, schemaId, webmcpResult?.success ?? true);
          res.status(200).json({
            success: true,
            executionPath: 'WEBMCP',
            message: 'WebMCP execution logged successfully',
          });
          return;
        }

        // ─── Path B: Vision AI Fallback ──────────────────
        if (!tenantId || !schemaId || !sourceDocumentBase64 || !targetScreenshotBase64) {
          res.status(400).json({
            error: 'Missing required fields: tenantId, schemaId, sourceDocumentBase64, targetScreenshotBase64',
          });
          return;
        }

        const result = await visionMap({
          tenantId,
          schemaId,
          sourceDocumentBase64,
          sourceDocumentMimeType: sourceDocumentMimeType || 'image/png',
          targetScreenshotBase64,
        });

        // Include usage metadata in the response for client-side monitoring
        res.status(result.success ? 200 : 500).json(result);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: errMsg });
      }
    });
  }
);

// ─── Data Migration Endpoint (Dual-Surface Controller) ──────

export const processMigration = onRequest(
  { memory: '2GiB', timeoutSeconds: 300, region: 'us-central1' },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const result = await processMigrationStep(req.body);
        res.status(result.success ? 200 : 500).json(result);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: errMsg });
      }
    });
  }
);

// ─── Cache Invalidation Endpoint ────────────────────────────

export const invalidateTenantCache = onRequest(
  { region: 'us-central1' },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const { tenantId, schemaId } = req.body;

        if (!tenantId) {
          res.status(400).json({ error: 'Missing required field: tenantId' });
          return;
        }

        await invalidateCache(tenantId, schemaId);
        res.status(200).json({
          success: true,
          message: `Cache invalidated for tenant=${tenantId}${schemaId ? ` schema=${schemaId}` : ' (all schemas)'}`,
        });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: errMsg });
      }
    });
  }
);

export const getMigrationReport = onRequest(
  { memory: '1GiB', timeoutSeconds: 300, region: 'us-central1' },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const { tenantId, sessionId } = req.body;
        if (!tenantId || !sessionId) {
          res.status(400).json({ error: 'Missing tenantId or sessionId' });
          return;
        }

        const result = await generateMigrationProof(tenantId, sessionId);
        res.status(200).json(result);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: errMsg });
      }
    });
  }
);

// ─── Tenant Management Endpoints ────────────────────────────

export const tenantApi = onRequest(
  { region: 'us-central1' },
  (req, res) => {
    corsHandler(req, res, async () => {
      const path = req.path.replace(/^\/+|\/+$/g, '');
      const segments = path.split('/');

      try {
        // POST / — Create tenant
        if (req.method === 'POST' && segments.length <= 1 && !segments[0]) {
          const tenant = await createTenant(req.body);
          res.status(201).json(tenant);
          return;
        }

        // GET / — List tenants
        if (req.method === 'GET' && segments.length <= 1 && !segments[0]) {
          const tenants = await listTenants();
          res.status(200).json(tenants);
          return;
        }

        // GET /:tenantId
        if (req.method === 'GET' && segments.length === 1) {
          const tenant = await getTenant(segments[0]);
          if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
          }
          res.status(200).json(tenant);
          return;
        }

        // PUT /:tenantId
        if (req.method === 'PUT' && segments.length === 1) {
          const tenant = await updateTenant(segments[0], req.body);
          res.status(200).json(tenant);
          return;
        }

        // ─── Schema sub-routes: /:tenantId/schemas ──────

        // POST /:tenantId/schemas
        if (req.method === 'POST' && segments.length === 2 && segments[1] === 'schemas') {
          const schema = await createFieldMappingSchema({ ...req.body, tenantId: segments[0] });
          // Invalidate cache when schema changes
          await invalidateCache(segments[0]).catch(() => {});
          res.status(201).json(schema);
          return;
        }

        // GET /:tenantId/schemas
        if (req.method === 'GET' && segments.length === 2 && segments[1] === 'schemas') {
          const schemas = await listFieldMappingSchemas(segments[0]);
          res.status(200).json(schemas);
          return;
        }

        // PUT /:tenantId/schemas/:schemaId
        if (req.method === 'PUT' && segments.length === 3 && segments[1] === 'schemas') {
          const schema = await updateFieldMappingSchema(segments[0], segments[2], req.body);
          // Invalidate cache when schema changes
          await invalidateCache(segments[0], segments[2]).catch(() => {});
          res.status(200).json(schema);
          return;
        }

        // DELETE /:tenantId/schemas/:schemaId
        if (req.method === 'DELETE' && segments.length === 3 && segments[1] === 'schemas') {
          await deleteFieldMappingSchema(segments[0], segments[2]);
          // Invalidate cache when schema is deleted
          await invalidateCache(segments[0], segments[2]).catch(() => {});
          res.status(204).send('');
          return;
        }

        res.status(404).json({ error: 'Not found' });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: errMsg });
      }
    });
  }
);
