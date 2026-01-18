import { db } from '../db';
import {
  certInstitutions,
  certKnowledge,
  certImageFeatures
} from '../db/schema';

async function checkData() {
  try {
    const institutions = await db.select().from(certInstitutions);
    console.log('Institutions count:', institutions.length);
    if (institutions.length > 0) {
      console.log(
        'First institution:',
        institutions[0].code,
        institutions[0].name
      );
    }

    const knowledge = await db.select().from(certKnowledge);
    console.log('Knowledge count:', knowledge.length);

    const features = await db.select().from(certImageFeatures);
    console.log('Features count:', features.length);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkData();
