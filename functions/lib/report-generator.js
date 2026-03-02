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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMigrationProof = generateMigrationProof;
const admin = __importStar(require("firebase-admin"));
const pdf_lib_1 = require("pdf-lib");
async function generateMigrationProof(tenantId, sessionId) {
    const db = admin.firestore();
    const sessionDoc = await db.doc(`tenants/${tenantId}/migration_sessions/${sessionId}`).get();
    const session = sessionDoc.data();
    if (!session)
        throw new Error('Session not found');
    const jobsSnap = await db.collection(`tenants/${tenantId}/migration_sessions/${sessionId}/jobs`).get();
    const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const logsSnap = await db.collection('migration_logs')
        .where('sessionId', '==', sessionId)
        .orderBy('createdAt', 'desc')
        .get();
    const logs = logsSnap.docs.map(d => d.data());
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    // --- Page 1: Executive Summary ---
    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    // Branding
    page.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: (0, pdf_lib_1.rgb)(0.05, 0.05, 0.05),
    });
    page.drawText('TALOS MIGRATION PROOF', {
        x: 50,
        y: height - 60,
        size: 24,
        font: boldFont,
        color: (0, pdf_lib_1.rgb)(1, 1, 1),
    });
    page.drawText('Official Audit & Accuracy Certificate', {
        x: 50,
        y: height - 80,
        size: 10,
        font: font,
        color: (0, pdf_lib_1.rgb)(0.6, 0.6, 1),
    });
    // Summary Table
    let y = height - 150;
    page.drawText('EXECUTIVE SUMMARY', { x: 50, y, size: 14, font: boldFont });
    y -= 30;
    const stats = [
        ['Migration Name', session.name],
        ['Source Application', session.sourceApp],
        ['Target Application', session.targetApp],
        ['Total Records', session.totalRecords.toString()],
        ['Successfully Migrated', session.migratedCount.toString()],
        ['Exceptions Logged', session.exceptionCount.toString()],
        ['Success Rate', `${((session.migratedCount / session.totalRecords) * 100).toFixed(1)}%`],
        ['Tokens Saved (ROI)', `${(session.totalTokensSaved / 1000).toFixed(1)}k tokens`],
    ];
    for (const [label, val] of stats) {
        page.drawText(label, { x: 50, y, size: 10, font: font, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4) });
        page.drawText(val, { x: 250, y, size: 10, font: boldFont });
        y -= 25;
    }
    // --- Page 2: Exception List ---
    const exceptions = logs.filter(l => l.status === 'Failed');
    if (exceptions.length > 0) {
        page = pdfDoc.addPage([600, 800]);
        y = height - 50;
        page.drawText('EXCEPTION AUDIT TRAIL', { x: 50, y, size: 14, font: boldFont });
        y -= 40;
        // Header
        page.drawRectangle({ x: 50, y: y - 5, width: 500, height: 20, color: (0, pdf_lib_1.rgb)(0.95, 0.95, 0.95) });
        page.drawText('RECORD ID', { x: 60, y, size: 8, font: boldFont });
        page.drawText('ERROR DESCRIPTION', { x: 160, y, size: 8, font: boldFont });
        y -= 25;
        for (const ex of exceptions.slice(0, 20)) {
            if (y < 50)
                break;
            page.drawText(ex.source_record_id || 'UNKNOWN', { x: 60, y, size: 8, font: font });
            const errorText = (ex.error || 'UI Logic Conflict').substring(0, 80);
            page.drawText(errorText, { x: 160, y, size: 8, font: font, color: (0, pdf_lib_1.rgb)(0.8, 0, 0) });
            y -= 20;
        }
    }
    // Finalize
    const pdfBytes = await pdfDoc.save();
    // Upload to Storage
    const bucket = admin.storage().bucket();
    const filePath = `tenants/${tenantId}/migration_reports/${sessionId}_proof.pdf`;
    const file = bucket.file(filePath);
    await file.save(Buffer.from(pdfBytes), {
        metadata: { contentType: 'application/pdf' },
    });
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-17-2027', // Long expiration for audit purposes
    });
    return { url };
}
//# sourceMappingURL=report-generator.js.map