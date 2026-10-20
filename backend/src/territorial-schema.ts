import {
  date,
  doublePrecision,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import type {
  FacilityCategory,
  PublicationState,
  PublicSource,
  SyncCoverage,
  TerritorialGeometry,
} from '../../shared/contracts.js';
import { municipalities, sourceSyncRuns } from './schema.js';

export const dataSources = pgTable('data_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  officialUrl: text('official_url').notNull(),
  attribution: text('attribution'),
  usage: text('usage')
    .$type<PublicSource['usage']>()
    .notNull()
    .default('unknown'),
  usageEvidenceUrl: text('usage_evidence_url'),
  state: text('state')
    .$type<PublicationState>()
    .notNull()
    .default('unavailable'),
  coverage: text('coverage').$type<SyncCoverage>().notNull().default('unknown'),
  referenceDate: date('reference_date'),
  sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedRunId: text('published_run_id').references(() => sourceSyncRuns.id),
  details: jsonb('details')
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
});
export const territorialBoundaries = pgTable(
  'territorial_boundaries',
  {
    id: text('id').primaryKey(),
    municipalityId: text('municipality_id')
      .notNull()
      .default('3304557')
      .references(() => municipalities.id),
    sourceId: text('source_id')
      .notNull()
      .references(() => dataSources.id),
    externalId: text('external_id').notNull(),
    name: text('name').notNull(),
    geometry: jsonb('geometry')
      .$type<Exclude<TerritorialGeometry, { type: 'Point' }>>()
      .notNull(),
    originalData: jsonb('original_data')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    lastSeenRunId: text('last_seen_run_id').references(() => sourceSyncRuns.id),
  },
  (table) => [unique().on(table.sourceId, table.externalId)],
);
export const territorialBoundaryAliases = pgTable(
  'territorial_boundary_aliases',
  {
    sourceId: text('source_id')
      .notNull()
      .references(() => dataSources.id),
    externalCode: text('external_code').notNull(),
    boundaryId: text('boundary_id')
      .notNull()
      .references(() => territorialBoundaries.id),
  },
  (table) => [primaryKey({ columns: [table.sourceId, table.externalCode] })],
);
export const publicFacilities = pgTable(
  'public_facilities',
  {
    id: text('id').primaryKey(),
    municipalityId: text('municipality_id')
      .notNull()
      .default('3304557')
      .references(() => municipalities.id),
    sourceId: text('source_id')
      .notNull()
      .references(() => dataSources.id),
    externalId: text('external_id').notNull(),
    category: text('category').$type<FacilityCategory>().notNull(),
    name: text('name').notNull(),
    address: text('address'),
    phone: text('phone'),
    openingHours: text('opening_hours'),
    activity: text('activity'),
    facilityType: text('facility_type'),
    neighborhoodId: text('neighborhood_id').references(
      () => territorialBoundaries.id,
    ),
    neighborhoodName: text('neighborhood_name'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    geometry: jsonb('geometry').$type<TerritorialGeometry>(),
    originalData: jsonb('original_data')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    lastSeenRunId: text('last_seen_run_id').references(() => sourceSyncRuns.id),
  },
  (table) => [unique().on(table.sourceId, table.externalId)],
);
