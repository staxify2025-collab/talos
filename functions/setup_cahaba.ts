import * as admin from 'firebase-admin';

// Initialize Firebase Admin (uses Application Default Credentials locally)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'talos-saas',
  });
}

const db = admin.firestore();

async function setupCahaba() {
  console.log('Setting up Cahaba Restoration...');
  const tenantRef = db.collection('tenants').doc();
  const tenantId = tenantRef.id;

  const newTenant = {
    id: tenantId,
    name: 'Cahaba Restoration',
    plan: 'enterprise',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await tenantRef.set(newTenant);
  console.log(`✅ Created tenant: Cahaba Restoration`);
  console.log(`✅ Tenant ID: ${tenantId}`);

  // Create an initial schema for their App-to-App use case
  const schemaRef = db.collection('schemas').doc();
  const schemaId = schemaRef.id;

  const newSchema = {
    id: schemaId,
    tenantId: tenantId,
    name: 'App to App Data Transfer',
    targetApp: 'Target Application',
    description: 'Extracts data from one UI and enters it into another.',
    mappings: [
      { sourceField: 'Customer Name', targetLabel: 'Client Name' },
      { sourceField: 'Project Address', targetLabel: 'Address' },
      { sourceField: 'Insurance Claim #', targetLabel: 'Claim Number' }
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await schemaRef.set(newSchema);
  console.log(`✅ Created initial schema for App-to-App mapping`);
  console.log(`✅ Schema ID: ${schemaId}`);

  console.log('\nDone.');
  process.exit(0);
}

setupCahaba().catch(console.error);
