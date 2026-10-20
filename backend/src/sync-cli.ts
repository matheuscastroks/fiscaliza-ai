import { database } from './db.js';
import { runRio1746Sync } from './integrations/rio1746/sync.js';

async function main() {
  const args = process.argv.slice(2);
  const targetPartition = args[0] || process.env.RIO1746_SYNC_PARTITION || '2026-09-20';
  const limit = args[1] ? parseInt(args[1], 10) : 5000;

  console.log(`[Rio1746 Sync CLI] Starting sync for partition: ${targetPartition} (limit: ${limit})`);
  const startTime = Date.now();

  const { db, pool } = database();
  try {
    const result = await runRio1746Sync(db, targetPartition, limit);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Rio1746 Sync CLI] Finished successfully in ${elapsed}s:`, result);
  } catch (err) {
    console.error('[Rio1746 Sync CLI] Sync failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
