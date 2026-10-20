import { BigQuery } from '@google-cloud/bigquery';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function ensureDefaultCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return;
  }
  const appData = process.env.APPDATA;
  if (!appData) return;

  const candidateAdc = resolve(appData, 'gcloud/application_default_credentials.json');
  if (existsSync(candidateAdc)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = candidateAdc;
    return;
  }

  const legacyCandidate = resolve(appData, 'gcloud/legacy_credentials/matheus.cocao30@gmail.com/adc.json');
  if (existsSync(legacyCandidate)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = legacyCandidate;
  }
}

export function createBigQueryClient(projectId?: string): BigQuery {
  ensureDefaultCredentials();
  const targetProject =
    projectId ||
    process.env.GCP_PROJECT_ID ||
    process.env.BIGQUERY_PROJECT_ID ||
    'gen-lang-client-0798661946';

  return new BigQuery({
    projectId: targetProject,
    location: 'US',
  });
}
