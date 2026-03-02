const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Use application default credentials (requires GOOGLE_APPLICATION_CREDENTIALS env var
// OR being logged in via gcloud auth application-default login)
// As a fallback, we can use the web SDK if we know the config, but Admin SDK is better for scripts.
// Let's try to just initialize and see if it picks up the local firebase CLI auth.
try {
  initializeApp();
} catch (e) {
  console.log("Failed to initialize app automatically. We might need a service account key.", e.message);
}

const db = getFirestore();

async function cleanMockData() {
  try {
    const tenantsRef = db.collection('tenants');
    const snapshot = await tenantsRef.get();
    
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }

    let keptCount = 0;
    let deletedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const name = data.name || '';
      
      // Keep Houston County Road & Bridge
      if (name.toLowerCase().includes('houston county')) {
        console.log(`[KEEPING] ${doc.id} => ${name}`);
        keptCount++;
        continue;
      }
      
      // Otherwise, delete it
      console.log(`[DELETING] ${doc.id} => ${name}`);
      await doc.ref.delete();
      deletedCount++;
      
      // Also delete subcollections (jobs, runs, migration_sessions, field_mapping_schemas, knowledge)
      // Note: Shallow deletes don't automatically delete subcollections in Firestore,
      // but for this mock cleanup, we'll try to explicitly delete them if they exist.
      const subcollections = ['jobs', 'runs', 'migration_sessions', 'field_mapping_schemas', 'knowledge'];
      for (const sub of subcollections) {
        const subSnap = await doc.ref.collection(sub).get();
        for (const subDoc of subSnap.docs) {
           await subDoc.ref.delete();
        }
      }
    }
    
    console.log(`\nCleanup complete. Kept: ${keptCount}, Deleted: ${deletedCount}`);
  } catch (error) {
    console.error("Error cleaning up mock data:", error);
  }
}

cleanMockData();
