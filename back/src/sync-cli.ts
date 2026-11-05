import { database } from './db.js';
import {
  runRio1746RangeSync,
  runRio1746Sync,
} from './integrations/rio1746/sync.js';

async function main() {
  const args = process.argv.slice(2);
  const firstArg = args[0] || process.env.RIO1746_SYNC_PARTITION;
  if (!firstArg)
    throw new Error('Informe a partição ou intervalo a sincronizar.');
  const secondArg = args[1];
  if (args.length > 2) throw new Error('Use uma data e um limite, ou duas datas.');
  if (secondArg && !/^\d{4}-\d{2}-\d{2}$/.test(secondArg) &&
      (!/^\d+$/.test(secondArg) || Number(secondArg) < 10 || Number(secondArg) > 50000)) {
    throw new Error('O limite deve ser um inteiro entre 10 e 50000.');
  }

  const { db, pool } = database();
  const startTime = Date.now();

  try {
    // If secondArg is a YYYY-MM-DD date, sync the full partition range [firstArg..secondArg]
    if (secondArg && /^\d{4}-\d{2}-\d{2}$/.test(secondArg)) {
      console.log(
        `[Rio1746 Sync CLI] Syncing partition range: ${firstArg} .. ${secondArg}`,
      );
      const result = await runRio1746RangeSync(db, pool, firstArg, secondArg);
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
        maxRecords
          ? `maxRecords: ${maxRecords}`
          : 'full partition with pagination'
      })`,
    );
    const result = await runRio1746Sync(
      db,
      pool,
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
