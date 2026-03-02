"use strict";
/**
 * Vision Mapper v2 — Gemini 3 Flash with Context Caching
 *
 * Core Vision Mapping Service for the Talos platform.
 * Uses the Google Gen AI SDK with Vertex AI backend.
 *
 * Architecture:
 *  - Tenant's static screenshot + schema → CACHED (via cache-manager)
 *  - New source document → sent FRESH each request
 *  - Result: "warm start" — only the new data is processed at full price
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.visionMap = visionMap;
exports.logWebMCPRun = logWebMCPRun;
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
const cache_manager_1 = require("./cache-manager");
if (!admin.apps.length) {
    admin.initializeApp();
}
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'talos-saas';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-3-flash-preview';
// ─── System Prompt ──────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are the Talos Vision AI Automation Engine — a pixel-precise coordinate mapper powered by Gemini 3 Flash.

YOUR CAPABILITIES:
- You have exceptional multimodal reasoning for analyzing both structured and unstructured documents.
- You can identify input fields in ANY software interface — modern web apps, legacy ERP systems, terminal-based UIs, and custom desktop applications.
- You provide pixel-precise bounding box coordinates for every identified field.

YOUR TASK:
1. EXTRACT: Analyze the NEW source document provided in the current request. Extract the value for each source field defined in the Field Mapping Schema (provided in the cached context).
2. LOCATE: Using the cached target application screenshot, identify the EXACT pixel bounding box of each target input field.
3. MAP: Return a JSON object mapping extracted values to their target coordinates.

COORDINATE FORMAT:
- All coordinates MUST be in [ymin, xmin, ymax, xmax] format.
- Values are absolute pixel positions within the screenshot image.
- ymin = top edge of the input field, xmin = left edge, ymax = bottom edge, xmax = right edge.
- Be precise — the automation layer will click the CENTER of each bounding box.

HANDLING LEGACY/UNSTRUCTURED SOFTWARE:
- For legacy software with non-standard UI elements, look for text labels NEAR input fields.
- Match labels even if they use abbreviations, different casing, or partial matches.
- For table-based layouts, use row/column position to identify fields.

OUTPUT FORMAT (strict JSON, no markdown, no explanations):
{
  "extractedData": {
    "<sourceField>": "<extracted_value>"
  },
  "actions": [
    {
      "field": "<sourceField>",
      "value": "<extracted_value>",
      "boundingBox": { "ymin": <int>, "xmin": <int>, "ymax": <int>, "xmax": <int> },
      "confidence": <0.0_to_1.0>
    }
  ]
}

RULES:
- If a source field value cannot be found, set value to "" and confidence to 0.
- If a target field cannot be located in the screenshot, set all boundingBox values to -1 and confidence to 0.
- GROUNDING: Use the provided Tenant Knowledge Base to inform extraction rules (e.g., date formats, currency symbols, specific business logic mentioned in docs).
- Return ONLY valid JSON. No markdown fences, no comments.`;
// ─── Core Engine ────────────────────────────────────────────
async function visionMap(request) {
    const { tenantId, schemaId, sourceDocumentBase64, sourceDocumentMimeType, targetScreenshotBase64, } = request;
    const db = admin.firestore();
    try {
        // 1. Retrieve the field mapping schema from Firestore
        const schemaDoc = await db
            .collection('tenants')
            .doc(tenantId)
            .collection('field_mapping_schemas')
            .doc(schemaId)
            .get();
        if (!schemaDoc.exists) {
            return {
                success: false,
                actions: [],
                extractedData: {},
                usageMetadata: null,
                cacheStatus: 'NONE',
                error: `Schema ${schemaId} not found for tenant ${tenantId}`,
            };
        }
        const schema = schemaDoc.data();
        const mappings = schema.mappings;
        // 3. Retrieve tenant knowledge base for grounding
        const knowledgeSnap = await db
            .collection('tenants')
            .doc(tenantId)
            .collection('knowledge')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        const knowledgeBase = knowledgeSnap.docs
            .map(d => `- ${d.data().name}: ${d.data().type} file content/metadata`)
            .join('\n');
        const schemaContext = `Schema: "${schema.name}"\nTarget Application: "${schema.targetApp}"\n\nMappings:\n${mappingDescription}${knowledgeBase ? `\n\nTenant Knowledge Base (Grounding):\n${knowledgeBase}` : ''}`;
        // 4. Get or create cached context (screenshot + schema = WARM START)
        const { cacheName, isNew } = await (0, cache_manager_1.getOrCreateCache)(tenantId, schemaId, targetScreenshotBase64, SYSTEM_INSTRUCTION, schemaContext);
        // 4. Generate content — only the NEW source document is sent fresh
        const client = new genai_1.GoogleGenAI({
            vertexai: true,
            project: PROJECT_ID,
            location: LOCATION,
        });
        const result = await client.models.generateContent({
            model: MODEL_ID,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: 'Analyze the following NEW source document. Extract all field values and map them to the target application fields using the cached screenshot and schema. Return pixel-precise bounding boxes in [ymin, xmin, ymax, xmax] format.',
                        },
                        {
                            inlineData: {
                                mimeType: sourceDocumentMimeType,
                                data: sourceDocumentBase64,
                            },
                        },
                    ],
                },
            ],
            config: {
                cachedContent: cacheName,
                temperature: 0.1,
                topP: 0.8,
                maxOutputTokens: 8192,
                thinkingConfig: {
                    thinkingBudget: 1024, // MEDIUM thinking level
                },
            },
        });
        // 5. Extract usage metadata for ROI tracking
        const rawUsage = result.usageMetadata;
        const usageMetadata = {
            cachedContentTokenCount: rawUsage?.cachedContentTokenCount || 0,
            totalTokenCount: rawUsage?.totalTokenCount || 0,
            promptTokenCount: rawUsage?.promptTokenCount || 0,
            candidatesTokenCount: rawUsage?.candidatesTokenCount || 0,
            thoughtsTokenCount: rawUsage?.thoughtsTokenCount || 0,
        };
        // 6. Parse the JSON response
        const responseText = result.text || '';
        const cleanedJson = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const parsed = JSON.parse(cleanedJson);
        // 7. Log performance to Firestore
        await logJobRun(db, tenantId, schemaId, usageMetadata, isNew ? 'CREATED' : 'HIT', true, 'VISION');
        return {
            success: true,
            extractedData: parsed.extractedData || {},
            actions: parsed.actions || [],
            usageMetadata,
            cacheStatus: isNew ? 'CREATED' : 'HIT',
        };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Vision mapping failed:', errMsg);
        return {
            success: false,
            actions: [],
            extractedData: {},
            usageMetadata: null,
            cacheStatus: 'NONE',
            error: errMsg,
        };
    }
}
// ─── Performance Logging ────────────────────────────────────
async function logJobRun(db, tenantId, schemaId, usage, cacheStatus, success, executionPath = 'VISION') {
    try {
        const runRef = db
            .collection('tenants')
            .doc(tenantId)
            .collection('runs')
            .doc();
        await runRef.set({
            schemaId,
            model: MODEL_ID,
            success,
            cacheStatus,
            executionPath,
            usageMetadata: {
                cachedContentTokenCount: usage.cachedContentTokenCount,
                totalTokenCount: usage.totalTokenCount,
                promptTokenCount: usage.promptTokenCount,
                candidatesTokenCount: usage.candidatesTokenCount,
                thoughtsTokenCount: usage.thoughtsTokenCount,
            },
            tokenSavingsPercent: usage.totalTokenCount > 0
                ? Math.round((usage.cachedContentTokenCount / usage.totalTokenCount) * 100)
                : 0,
            createdAt: admin.firestore.Timestamp.now(),
        });
        console.log(`[Perf Log] tenant=${tenantId} path=${executionPath} cache=${cacheStatus} ` +
            `cached=${usage.cachedContentTokenCount}/${usage.totalTokenCount} tokens ` +
            `(${usage.totalTokenCount > 0 ? Math.round((usage.cachedContentTokenCount / usage.totalTokenCount) * 100) : 0}% savings)`);
    }
    catch (err) {
        console.error('Failed to log run metrics:', err);
    }
}
// ─── WebMCP Run Logging (exported for index.ts) ─────────────
/**
 * Log a WebMCP execution. No Gemini tokens consumed — only the structured
 * action is recorded for ROI tracking and analytics.
 */
async function logWebMCPRun(tenantId, schemaId, success) {
    const db = admin.firestore();
    const zeroUsage = {
        cachedContentTokenCount: 0,
        totalTokenCount: 0,
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        thoughtsTokenCount: 0,
    };
    await logJobRun(db, tenantId, schemaId, zeroUsage, 'HIT', success, 'WEBMCP');
}
//# sourceMappingURL=vision-mapper.js.map