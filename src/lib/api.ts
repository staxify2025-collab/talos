import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from './firebase';
import type { 
  Job, 
  FieldMappingSchema, 
  RunLog, 
  Tenant,
  MigrationSession,
  MigrationJob
} from './firestore-schema';

export interface KnowledgeFile {
  id: string;
  name: string;
  tenantId: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts as string);
}

function requireDb() {
  if (!db) throw new Error('Firestore not configured — set NEXT_PUBLIC_FIREBASE_* env vars');
  return db;
}

function requireStorage() {
  if (!storage) throw new Error('Storage not configured — set NEXT_PUBLIC_FIREBASE_* env vars');
  return storage;
}

// ─── Schemas ─────────────────────────────────────────────────

export async function getSchemas(tenantId: string): Promise<FieldMappingSchema[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, `tenants/${tenantId}/field_mapping_schemas`), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tenantId,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as FieldMappingSchema;
  });
}

// ─── Tenant Management (Cloud Functions) ─────────────────────

function getFunctionsUrl() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `http://localhost:5001/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/us-central1`;
  }
  return (
    process.env.NEXT_PUBLIC_FUNCTIONS_URL ??
    `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net`
  );
}

export async function listTenants(): Promise<Tenant[]> {
  const res = await fetch(`${getFunctionsUrl()}/tenantApi`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to list tenants: ${res.status}`);
  return res.json();
}

export async function createTenant(input: {
  name: string;
  plan: string;
  ownerEmail: string;
  ownerName: string;
}): Promise<Tenant> {
  const res = await fetch(`${getFunctionsUrl()}/tenantApi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create tenant: ${res.status}`);
  return res.json();
}

// ─── Schema Management (Cloud Functions) ─────────────────────

export async function createSchema(tenantId: string, input: Partial<FieldMappingSchema>): Promise<FieldMappingSchema> {
  const res = await fetch(`${getFunctionsUrl()}/tenantApi/${tenantId}/schemas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create schema: ${res.status}`);
  return res.json();
}

export async function updateSchema(tenantId: string, schemaId: string, updates: Partial<FieldMappingSchema>): Promise<FieldMappingSchema> {
  const res = await fetch(`${getFunctionsUrl()}/tenantApi/${tenantId}/schemas/${schemaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update schema: ${res.status}`);
  return res.json();
}

export async function deleteSchema(tenantId: string, schemaId: string): Promise<void> {
  const res = await fetch(`${getFunctionsUrl()}/tenantApi/${tenantId}/schemas/${schemaId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to delete schema: ${res.status}`);
}

// ─── Jobs ────────────────────────────────────────────────────

export async function getJobs(tenantId: string): Promise<Job[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, `tenants/${tenantId}/jobs`), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : null,
    } as Job;
  });
}

/** Real-time listener for a tenant's jobs */
export function subscribeJobs(
  tenantId: string,
  onUpdate: (jobs: Job[]) => void
): Unsubscribe {
  const firestore = requireDb();
  const q = query(collection(firestore, `tenants/${tenantId}/jobs`), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toDate(data.createdAt),
        completedAt: data.completedAt ? toDate(data.completedAt) : null,
      } as Job;
    });
    onUpdate(jobs);
  });
}

// ─── Runs (analytics) ───────────────────────────────────────

export async function getRuns(tenantId: string): Promise<RunLog[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, `tenants/${tenantId}/runs`), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      createdAt: toDate(data.createdAt),
    } as RunLog;
  });
}

// ─── Training / Knowledge Base ──────────────────────────────

export async function listKnowledgeBase(tenantId: string): Promise<KnowledgeFile[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, `tenants/${tenantId}/knowledge`), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tenantId,
      ...data,
      createdAt: toDate(data.createdAt),
    } as KnowledgeFile;
  });
}

export async function uploadKnowledgeBase(tenantId: string, file: File): Promise<KnowledgeFile> {
  const firestore = requireDb();
  const storage = requireStorage();

  // 1. Upload to Storage
  const storagePath = `tenants/${tenantId}/knowledge/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // 2. Save metadata to Firestore
  const docRef = doc(collection(firestore, `tenants/${tenantId}/knowledge`));
  const knowledgeFile = {
    name: file.name,
    type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
    size: file.size,
    url,
    createdAt: Timestamp.now(),
  };

  await setDoc(docRef, knowledgeFile);

  return {
    id: docRef.id,
    tenantId,
    ...knowledgeFile,
    createdAt: toDate(knowledgeFile.createdAt),
  } as KnowledgeFile;
}

// ─── Tenant ─────────────────────────────────────────────────

export async function getTenant(tenantId: string) {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'tenants', tenantId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─── Submit Job (calls Cloud Function) ──────────────────────

export async function submitJob(opts: {
  tenantId: string;
  schemaId: string;
  sourceDocumentBase64: string;
  sourceDocumentMimeType: string;
  targetScreenshotBase64: string;
}) {
  const fnUrl = getFunctionsUrl();

  const res = await fetch(`${fnUrl}/processVisionMapping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Migration ──────────────────────────────────────────────

export async function createMigrationSession(tenantId: string, session: Partial<MigrationSession>): Promise<MigrationSession> {
  const firestore = requireDb();
  const docRef = doc(collection(firestore, `tenants/${tenantId}/migration_sessions`));
  const newSession = {
    ...session,
    id: docRef.id,
    tenantId,
    status: 'pending',
    totalRecords: 0,
    migratedCount: 0,
    exceptionCount: 0,
    totalTokensSaved: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(docRef, newSession);
  return {
    ...newSession,
    createdAt: toDate(newSession.createdAt),
    updatedAt: toDate(newSession.updatedAt),
  } as MigrationSession;
}

export function subscribeMigrationSession(
  tenantId: string,
  sessionId: string,
  onUpdate: (session: MigrationSession) => void
): Unsubscribe {
  const firestore = requireDb();
  return onSnapshot(doc(firestore, `tenants/${tenantId}/migration_sessions`, sessionId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      onUpdate({
        id: snap.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as MigrationSession);
    }
  });
}

export async function getMigrationJobs(tenantId: string, sessionId: string): Promise<MigrationJob[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, `tenants/${tenantId}/migration_sessions/${sessionId}/jobs`), orderBy('createdAt', 'asc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : null,
    } as MigrationJob;
  });
}

export function subscribeMigrationJobs(
  tenantId: string,
  sessionId: string,
  onUpdate: (jobs: MigrationJob[]) => void
): Unsubscribe {
  const firestore = requireDb();
  const q = query(collection(firestore, `tenants/${tenantId}/migration_sessions/${sessionId}/jobs`), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toDate(data.createdAt),
        completedAt: data.completedAt ? toDate(data.completedAt) : null,
      } as MigrationJob;
    });
    onUpdate(jobs);
  });
}

export async function submitMigrationStep(opts: {
  tenantId: string;
  sessionId: string;
  recordID: string;
  sourceScreenshotBase64: string;
  targetScreenshotBase64: string;
  schemaId: string;
}) {
  const fnUrl = getFunctionsUrl();
  const res = await fetch(`${fnUrl}/processMigrationStep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(`Migration step failed: ${res.status}`);
  return res.json();
}

export async function updateMigrationJob(
  tenantId: string, 
  sessionId: string, 
  jobId: string, 
  updates: Partial<MigrationJob>
): Promise<void> {
  const firestore = requireDb();
  const docRef = doc(firestore, `tenants/${tenantId}/migration_sessions/${sessionId}/jobs`, jobId);
  await setDoc(docRef, { ...updates, updatedAt: Timestamp.now() }, { merge: true });
}

export async function getMigrationReportUrl(tenantId: string, sessionId: string): Promise<string> {
  const fnUrl = getFunctionsUrl();
  const res = await fetch(`${fnUrl}/getMigrationReport`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, sessionId }),
  });
  if (!res.ok) throw new Error(`Failed to generate report: ${res.status}`);
  const { url } = await res.json();
  return url;
}
