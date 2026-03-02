import * as admin from 'firebase-admin';

// Initialize with application default credentials
try {
  admin.initializeApp();
} catch (e) {
  console.log("Failed to initialize app, trying alternative.", e);
}

const db = admin.firestore();

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
