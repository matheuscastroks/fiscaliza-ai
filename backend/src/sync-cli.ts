import { database } from './db.js';
import {
  runRio1746RangeSync,
  runRio1746Sync,
} from './integrations/rio1746/sync.js';

async function main() {
  const args = process.argv.slice(2);
  const firstArg = args[0] || process.env.RIO1746_SYNC_PARTITION || '2026-09-20';
  const secondArg = args[1];

  const { db, pool } = database();
  const startTime = Date.now();

  try {
    // If secondArg is a YYYY-MM-DD date, sync the full partition range [firstArg..secondArg]
    if (secondArg && /^\d{4}-\d{2}-\d{2}$/.test(secondArg)) {
      console.log(
        `[Rio1746 Sync CLI] Syncing partition range: ${firstArg} .. ${secondArg}`,
      );
      const result = await runRio1746RangeSync(db, firstArg, secondArg);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `[Rio1746 Sync CLI] Range sync finished in ${elapsed}s:`,
        result,
      );
      return;
    }

    const maxRecords = secondArg ? parseInt(secondArg, 10) : undefined;
    console.log(
      `[Rio1746 Sync CLI] Syncing partition: ${firstArg} (${
        maxRecords ? `maxRecords: ${maxRecords}` : 'full partition with pagination'
      })`,
    );
    const result = await runRio1746Sync(
      db,
      firstArg,
      maxRecords ? { maxRecords } : {},
    );
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[Rio1746 Sync CLI] Finished successfully in ${elapsed}s:`,
      result,
    );
  } catch (err) {
    console.error('[Rio1746 Sync CLI] Sync failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
