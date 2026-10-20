import { BigQuery } from '@google-cloud/bigquery';

/** GoogleAuth resolves ADC; never guess another local profile or billing project. */
export function createBigQueryClient(projectId?: string): BigQuery {
  const targetProject =
    projectId || process.env.GCP_PROJECT_ID || process.env.BIGQUERY_PROJECT_ID;
  if (!targetProject?.trim()) {
    throw new Error(
      'Configure GCP_PROJECT_ID (or BIGQUERY_PROJECT_ID) before synchronizing.',
    );
  }
  return new BigQuery({ projectId: targetProject.trim(), location: 'US' });
}
