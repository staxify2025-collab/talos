import * as admin from 'firebase-admin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateMigrationProof(tenantId: string, sessionId: string) {
  const db = admin.firestore();
  const sessionDoc = await db.doc(`tenants/${tenantId}/migration_sessions/${sessionId}`).get();
  const session = sessionDoc.data();

  if (!session) throw new Error('Session not found');

  const jobsSnap = await db.collection(`tenants/${tenantId}/migration_sessions/${sessionId}/jobs`).get();
  const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const logsSnap = await db.collection('migration_logs')
    .where('sessionId', '==', sessionId)
    .orderBy('createdAt', 'desc')
    .get();
  const logs = logsSnap.docs.map(d => d.data());

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- Page 1: Executive Summary ---
  let page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();

  // Branding
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText('TALOS MIGRATION PROOF', {
    x: 50,
    y: height - 60,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Official Audit & Accuracy Certificate', {
    x: 50,
    y: height - 80,
    size: 10,
    font: font,
    color: rgb(0.6, 0.6, 1),
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
    page.drawText(label, { x: 50, y, size: 10, font: font, color: rgb(0.4, 0.4, 0.4) });
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
    page.drawRectangle({ x: 50, y: y - 5, width: 500, height: 20, color: rgb(0.95, 0.95, 0.95) });
    page.drawText('RECORD ID', { x: 60, y, size: 8, font: boldFont });
    page.drawText('ERROR DESCRIPTION', { x: 160, y, size: 8, font: boldFont });
    y -= 25;

    for (const ex of exceptions.slice(0, 20)) {
      if (y < 50) break;
      page.drawText(ex.source_record_id || 'UNKNOWN', { x: 60, y, size: 8, font: font });
      const errorText = (ex.error || 'UI Logic Conflict').substring(0, 80);
      page.drawText(errorText, { x: 160, y, size: 8, font: font, color: rgb(0.8, 0, 0) });
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
