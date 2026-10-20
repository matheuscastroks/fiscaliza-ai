import type { FastifyInstance } from 'fastify';
import type { Database, ReadDatabase } from './db.js';
import type {
  FacilitiesQuery,
  FacilityCategory,
} from '../../shared/contracts.js';
import {
  getPublicBoundary,
  getPublicFacility,
  getPublicSources,
  listPublicBoundaries,
  listPublicFacilities,
} from './public-data-repository.js';
import { getNeighborhoodOverview } from './neighborhood-overview.js';
import {
  boundaryDetailSchema,
  boundaryIdParams,
  boundarySummarySchema,
  envelope,
  facilitiesPageSchema,
  facilitiesQuerySchema,
  facilityDetailSchema,
  neighborhoodOverviewSchema,
  sourceSchema,
} from './public-data-schemas.js';
export function registerPublicDataRoutes(
  app: FastifyInstance,
  db: Database,
): void {
  const ok = (data: unknown) => ({ success: true, data });
  const read = <T>(run: (connection: ReadDatabase) => Promise<T>) =>
    db.transaction((tx) => run(tx), {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    });
  app.get(
    '/api/data-sources',
    {
      schema: {
        tags: ['Território'],
        summary: 'Fontes integradas, cobertura e publicação conhecida',
        response: { 200: envelope({ type: 'array', items: sourceSchema }) },
      },
    },
    async () => ok(await read(getPublicSources)),
  );
  app.get<{
    Querystring: Omit<FacilitiesQuery, 'categories'> & { categories?: string };
  }>(
    '/api/public-facilities',
    {
      schema: {
        tags: ['Território'],
        summary: 'Equipamentos publicados por categoria, bairro e área visível',
        querystring: facilitiesQuerySchema,
        response: { 200: envelope(facilitiesPageSchema) },
      },
    },
    async (req) =>
      ok(
        await read((connection) =>
          listPublicFacilities(connection, {
            ...req.query,
            categories: req.query.categories?.split(',') as
              | FacilityCategory[]
              | undefined,
          }),
        ),
      ),
  );
  app.get<{ Params: { id: string } }>(
    '/api/public-facilities/:id',
    {
      schema: {
        tags: ['Território'],
        summary: 'Cadastro e geometria do equipamento com procedência',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', minLength: 1, maxLength: 200 } },
        },
        response: { 200: envelope(facilityDetailSchema) },
      },
    },
    async (req) =>
      ok(
        await read((connection) =>
          getPublicFacility(connection, req.params.id),
        ),
      ),
  );
  app.get(
    '/api/territorial-boundaries',
    {
      schema: {
        tags: ['Território'],
        summary: 'Bairros publicados, sem payload de geometria',
        response: {
          200: envelope({ type: 'array', items: boundarySummarySchema }),
        },
      },
    },
    async () => ok(await read(listPublicBoundaries)),
  );
  app.get<{ Params: { id: string } }>(
    '/api/territorial-boundaries/:id',
    {
      schema: {
        tags: ['Território'],
        summary: 'Limite geográfico e fonte de um bairro',
        params: boundaryIdParams,
        response: { 200: envelope(boundaryDetailSchema) },
      },
    },
    async (req) =>
      ok(
        await read((connection) =>
          getPublicBoundary(connection, req.params.id),
        ),
      ),
  );
  app.get<{
    Params: { id: string };
    Querystring: { startDate: string; endDate: string };
  }>(
    '/api/neighborhoods/:id/overview',
    {
      schema: {
        tags: ['Território'],
        summary:
          'Cadastros e chamados na base para um bairro e período explícitos',
        params: boundaryIdParams,
        querystring: {
          type: 'object',
          additionalProperties: false,
          required: ['startDate', 'endDate'],
          properties: {
            startDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            endDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          },
        },
        response: { 200: envelope(neighborhoodOverviewSchema) },
      },
    },
    async (req) =>
      ok(
        await read((connection) =>
          getNeighborhoodOverview(
            connection,
            req.params.id,
            req.query.startDate,
            req.query.endDate,
          ),
        ),
      ),
  );
}
