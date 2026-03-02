import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'talos-saas',
  });
}

const db = admin.firestore();

async function updateSchemaForArchive() {
  console.log('Updating Cahaba Restoration Schema for Archival Workflow...');
  
  // The schema ID we generated previously
  const schemaId = 'jPsSoORQ56hUKl3wBtLX'; 
  const schemaRef = db.collection('schemas').doc(schemaId);

  await schemaRef.update({
    name: 'Leap Historical Archive',
    targetApp: 'Dash',
    description: 'Reads historical job data from Leap CRM, compiles it into a Summary PDF, and uploads it to an archive container in Dash CRM.',
    // We update the mapping logic here. We don't need field-to-field mapping. 
    // We just need the Vision AI to extract everything.
    targetFields: [
      {
        targetLabel: 'Archive PDF Content',
        fieldType: 'text',
        description: 'Comprehensive summary text extracted from all available Leap job information.'
      }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Updated schema for archival workflow: ${schemaId}`);
  console.log('\nDone.');
  process.exit(0);
}

updateSchemaForArchive().catch(console.error);
