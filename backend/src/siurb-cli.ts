import { database } from './db.js';
import { syncSiurbLayer } from './integrations/siurb/sync.js';
import {
  getSiurbLayer,
  type SiurbLayerId,
} from './integrations/siurb/catalog.js';
async function main() {
  const arg = process.argv[2];
  if (!arg) throw new Error('Informe all ou uma camada: 18, 1, 2, 16.');
  const ids: SiurbLayerId[] =
    arg === 'all' ? [18, 1, 2, 16] : [Number(arg) as SiurbLayerId];
  for (const id of ids) getSiurbLayer(id);
  const { db, pool } = database();
  try {
    for (const id of ids)
      console.log(JSON.stringify(await syncSiurbLayer(pool, db, id)));
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Falha na sincronização.',
  );
  process.exitCode = 1;
});
