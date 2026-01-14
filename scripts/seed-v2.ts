import 'dotenv/config';
import { runAllSeeds } from '../src/db/seeds/achievements.seed';

async function main() {
  console.log('🌱 Starting V2.0 seed...');

  try {
    await runAllSeeds();
    console.log('✅ V2.0 seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
