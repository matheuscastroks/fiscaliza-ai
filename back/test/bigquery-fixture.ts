import type { BigQuery } from '@google-cloud/bigquery';

/** SDK boundary fixture; dry runs never advance the source's page. */
export function bigQueryFixture(
  nextPage: () => unknown[],
  billedBytes = '1',
): BigQuery {
  return {
    createQueryJob: async (options: { dryRun?: boolean }) => {
      if (options.dryRun)
        return [
          { metadata: { statistics: { totalBytesProcessed: billedBytes } } },
        ];
      const page = nextPage();
      return [
        {
          getQueryResults: async () => [page],
          getMetadata: async () => [
            { statistics: { query: { totalBytesBilled: billedBytes } } },
          ],
        },
      ];
    },
  } as unknown as BigQuery;
}
