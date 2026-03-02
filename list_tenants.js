import * as admin from 'firebase-admin';

// Initialize the app with default credentials (should work if logged in with firebase CLI)
admin.initializeApp();

const db = admin.firestore();

async function listData() {
  console.log('--- Tenants ---');
  const tenants = await db.collection('tenants').get();
  tenants.forEach(doc => {
    console.log(doc.id, '=>', doc.data().name);
  });
}

listData().catch(console.error);
