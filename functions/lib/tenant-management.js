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
exports.createTenant = createTenant;
exports.listTenants = listTenants;
exports.getTenant = getTenant;
exports.updateTenant = updateTenant;
exports.createFieldMappingSchema = createFieldMappingSchema;
exports.listFieldMappingSchemas = listFieldMappingSchemas;
exports.getFieldMappingSchema = getFieldMappingSchema;
exports.updateFieldMappingSchema = updateFieldMappingSchema;
exports.deleteFieldMappingSchema = deleteFieldMappingSchema;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
async function createTenant(input) {
    const tenantRef = db.collection('tenants').doc();
    const tenant = {
        name: input.name,
        plan: input.plan || 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        status: 'active',
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now(),
    };
    const ownerUser = {
        email: input.ownerEmail,
        displayName: input.ownerName,
        role: 'owner',
        tenantId: tenantRef.id,
        createdAt: firestore_1.Timestamp.now(),
    };
    const batch = db.batch();
    batch.set(tenantRef, tenant);
    batch.set(tenantRef.collection('users').doc(), ownerUser);
    await batch.commit();
    return { id: tenantRef.id, ...tenant };
}
async function listTenants() {
    const snapshot = await db.collection('tenants').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function getTenant(tenantId) {
    const doc = await db.collection('tenants').doc(tenantId).get();
    if (!doc.exists)
        return null;
    return { id: doc.id, ...doc.data() };
}
async function updateTenant(tenantId, updates) {
    await db
        .collection('tenants')
        .doc(tenantId)
        .update({ ...updates, updatedAt: firestore_1.Timestamp.now() });
    return getTenant(tenantId);
}
async function createFieldMappingSchema(input) {
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
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now(),
    };
    await schemaRef.set(schema);
    return { id: schemaRef.id, ...schema };
}
async function listFieldMappingSchemas(tenantId) {
    const snapshot = await db
        .collection('tenants')
        .doc(tenantId)
        .collection('field_mapping_schemas')
        .orderBy('createdAt', 'desc')
        .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function getFieldMappingSchema(tenantId, schemaId) {
    const doc = await db
        .collection('tenants')
        .doc(tenantId)
        .collection('field_mapping_schemas')
        .doc(schemaId)
        .get();
    if (!doc.exists)
        return null;
    return { id: doc.id, ...doc.data() };
}
async function updateFieldMappingSchema(tenantId, schemaId, updates) {
    await db
        .collection('tenants')
        .doc(tenantId)
        .collection('field_mapping_schemas')
        .doc(schemaId)
        .update({ ...updates, updatedAt: firestore_1.Timestamp.now() });
    return getFieldMappingSchema(tenantId, schemaId);
}
async function deleteFieldMappingSchema(tenantId, schemaId) {
    await db
        .collection('tenants')
        .doc(tenantId)
        .collection('field_mapping_schemas')
        .doc(schemaId)
        .delete();
}
//# sourceMappingURL=tenant-management.js.map