"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantApi = exports.invalidateTenantCache = exports.processVisionMapping = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
admin.initializeApp();
const vision_mapper_1 = require("./vision-mapper");
const cache_manager_1 = require("./cache-manager");
const tenant_management_1 = require("./tenant-management");
const corsHandler = (0, cors_1.default)({ origin: true });
// ─── Vision Mapping Endpoint (Gemini 3 Flash + Context Caching) ─
exports.processVisionMapping = (0, https_1.onRequest)({ memory: '2GiB', timeoutSeconds: 300, region: 'us-central1' }, (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        try {
            const { tenantId, schemaId, sourceDocumentBase64, sourceDocumentMimeType, targetScreenshotBase64, executionMode, webmcpResult, } = req.body;
            // ─── Path A: WebMCP Structured Execution ────────
            // Client already executed via navigator.modelContext.
            // We only log the result for tracking & ROI analysis.
            if (executionMode === 'WEBMCP') {
                if (!tenantId || !schemaId) {
                    res.status(400).json({ error: 'Missing required fields: tenantId, schemaId' });
                    return;
                }
                await (0, vision_mapper_1.logWebMCPRun)(tenantId, schemaId, webmcpResult?.success ?? true);
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
            const result = await (0, vision_mapper_1.visionMap)({
                tenantId,
                schemaId,
                sourceDocumentBase64,
                sourceDocumentMimeType: sourceDocumentMimeType || 'image/png',
                targetScreenshotBase64,
            });
            // Include usage metadata in the response for client-side monitoring
            res.status(result.success ? 200 : 500).json(result);
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errMsg });
        }
    });
});
// ─── Cache Invalidation Endpoint ────────────────────────────
exports.invalidateTenantCache = (0, https_1.onRequest)({ region: 'us-central1' }, (req, res) => {
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
            await (0, cache_manager_1.invalidateCache)(tenantId, schemaId);
            res.status(200).json({
                success: true,
                message: `Cache invalidated for tenant=${tenantId}${schemaId ? ` schema=${schemaId}` : ' (all schemas)'}`,
            });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errMsg });
        }
    });
});
// ─── Tenant Management Endpoints ────────────────────────────
exports.tenantApi = (0, https_1.onRequest)({ region: 'us-central1' }, (req, res) => {
    corsHandler(req, res, async () => {
        const path = req.path.replace(/^\/+|\/+$/g, '');
        const segments = path.split('/');
        try {
            // POST / — Create tenant
            if (req.method === 'POST' && segments.length <= 1 && !segments[0]) {
                const tenant = await (0, tenant_management_1.createTenant)(req.body);
                res.status(201).json(tenant);
                return;
            }
            // GET / — List tenants
            if (req.method === 'GET' && segments.length <= 1 && !segments[0]) {
                const tenants = await (0, tenant_management_1.listTenants)();
                res.status(200).json(tenants);
                return;
            }
            // GET /:tenantId
            if (req.method === 'GET' && segments.length === 1) {
                const tenant = await (0, tenant_management_1.getTenant)(segments[0]);
                if (!tenant) {
                    res.status(404).json({ error: 'Tenant not found' });
                    return;
                }
                res.status(200).json(tenant);
                return;
            }
            // PUT /:tenantId
            if (req.method === 'PUT' && segments.length === 1) {
                const tenant = await (0, tenant_management_1.updateTenant)(segments[0], req.body);
                res.status(200).json(tenant);
                return;
            }
            // ─── Schema sub-routes: /:tenantId/schemas ──────
            // POST /:tenantId/schemas
            if (req.method === 'POST' && segments.length === 2 && segments[1] === 'schemas') {
                const schema = await (0, tenant_management_1.createFieldMappingSchema)({ ...req.body, tenantId: segments[0] });
                // Invalidate cache when schema changes
                await (0, cache_manager_1.invalidateCache)(segments[0]).catch(() => { });
                res.status(201).json(schema);
                return;
            }
            // GET /:tenantId/schemas
            if (req.method === 'GET' && segments.length === 2 && segments[1] === 'schemas') {
                const schemas = await (0, tenant_management_1.listFieldMappingSchemas)(segments[0]);
                res.status(200).json(schemas);
                return;
            }
            // PUT /:tenantId/schemas/:schemaId
            if (req.method === 'PUT' && segments.length === 3 && segments[1] === 'schemas') {
                const schema = await (0, tenant_management_1.updateFieldMappingSchema)(segments[0], segments[2], req.body);
                // Invalidate cache when schema changes
                await (0, cache_manager_1.invalidateCache)(segments[0], segments[2]).catch(() => { });
                res.status(200).json(schema);
                return;
            }
            // DELETE /:tenantId/schemas/:schemaId
            if (req.method === 'DELETE' && segments.length === 3 && segments[1] === 'schemas') {
                await (0, tenant_management_1.deleteFieldMappingSchema)(segments[0], segments[2]);
                // Invalidate cache when schema is deleted
                await (0, cache_manager_1.invalidateCache)(segments[0], segments[2]).catch(() => { });
                res.status(204).send('');
                return;
            }
            res.status(404).json({ error: 'Not found' });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errMsg });
        }
    });
});
//# sourceMappingURL=index.js.map