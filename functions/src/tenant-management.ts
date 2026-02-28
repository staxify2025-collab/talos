import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

// ─── Tenant CRUD ────────────────────────────────────────────

export interface CreateTenantInput {
  name: string;
  plan?: 'free' | 'starter' | 'professional' | 'enterprise';
  ownerEmail: string;
  ownerName: string;
}

export async function createTenant(input: CreateTenantInput) {
  const tenantRef = db.collection('tenants').doc();

  const tenant = {
    name: input.name,
    plan: input.plan || 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ownerUser = {
    email: input.ownerEmail,
    displayName: input.ownerName,
    role: 'owner',
    tenantId: tenantRef.id,
    createdAt: Timestamp.now(),
  };

  const batch = db.batch();
  batch.set(tenantRef, tenant);
  batch.set(tenantRef.collection('users').doc(), ownerUser);
  await batch.commit();

  return { id: tenantRef.id, ...tenant };
}

export async function listTenants() {
  const snapshot = await db.collection('tenants').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getTenant(tenantId: string) {
  const doc = await db.collection('tenants').doc(tenantId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateTenant(tenantId: string, updates: Partial<{ name: string; plan: string; status: string }>) {
  await db
    .collection('tenants')
    .doc(tenantId)
    .update({ ...updates, updatedAt: Timestamp.now() });
  return getTenant(tenantId);
}

// ─── Field Mapping Schema CRUD ──────────────────────────────

export interface CreateSchemaInput {
  tenantId: string;
  name: string;
  targetApp: string;
  description: string;
  mappings: Array<{
    sourceField: string;
    targetLabel: string;
    region?: { x: number; y: number; width: number; height: number };
  }>;
}

export async function createFieldMappingSchema(input: CreateSchemaInput) {
  const schemaRef = db
    .collection('tenants')
    .doc(input.tenantId)
    .collection('field_mapping_schemas')
    .doc();

  const schema = {
    tenantId: input.tenantId,
    name: input.name,
    targetApp: input.targetApp,
    description: input.description,
    mappings: input.mappings,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await schemaRef.set(schema);
  return { id: schemaRef.id, ...schema };
}

export async function listFieldMappingSchemas(tenantId: string) {
  const snapshot = await db
    .collection('tenants')
    .doc(tenantId)
    .collection('field_mapping_schemas')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getFieldMappingSchema(tenantId: string, schemaId: string) {
  const doc = await db
    .collection('tenants')
    .doc(tenantId)
    .collection('field_mapping_schemas')
    .doc(schemaId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateFieldMappingSchema(
  tenantId: string,
  schemaId: string,
  updates: Partial<CreateSchemaInput>
) {
  await db
    .collection('tenants')
    .doc(tenantId)
    .collection('field_mapping_schemas')
    .doc(schemaId)
    .update({ ...updates, updatedAt: Timestamp.now() });

  return getFieldMappingSchema(tenantId, schemaId);
}

export async function deleteFieldMappingSchema(tenantId: string, schemaId: string) {
  await db
    .collection('tenants')
    .doc(tenantId)
    .collection('field_mapping_schemas')
    .doc(schemaId)
    .delete();
}
