import { BigQuery } from '@google-cloud/bigquery';
import { existsSync, readdirSync } from 'node:fs';
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

  // Fallback for local Windows gcloud CLI profiles without hardcoding any account identifier
  if (process.env.NODE_ENV !== 'production') {
    const legacyDir = resolve(appData, 'gcloud/legacy_credentials');
    if (existsSync(legacyDir)) {
      try {
        for (const entry of readdirSync(legacyDir, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            const adcPath = resolve(legacyDir, entry.name, 'adc.json');
            if (existsSync(adcPath)) {
              process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
              return;
            }
          }
        }
      } catch {
        // Ignore directory read errors and defer to standard GoogleAuth resolution
      }
    }
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
