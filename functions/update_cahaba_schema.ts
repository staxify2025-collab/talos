import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'talos-saas',
  });
}

const db = admin.firestore();

async function updateSchemaApps() {
  console.log('Updating Cahaba Restoration Schema target apps...');
  
  // The schema ID we generated previously
  const schemaId = 'jPsSoORQ56hUKl3wBtLX'; 
  const schemaRef = db.collection('schemas').doc(schemaId);

  await schemaRef.update({
    name: 'Leap to Dash Transfer',
    targetApp: 'Dash',
    // Currently, our schema structure doesn't explicitly have a `sourceApp` field,
    // but we can update the description to reflect it, or just use the name for now.
    description: 'Extracts data from the Leap CRM UI and enters it into the Dash CRM UI.',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Updated schema names/descriptions for Schema: ${schemaId}`);
  console.log('\nDone.');
  process.exit(0);
}

updateSchemaApps().catch(console.error);
