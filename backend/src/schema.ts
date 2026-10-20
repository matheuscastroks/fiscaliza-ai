import {
  pgTable,
  text,
  timestamp,
  jsonb,
  primaryKey,
  integer,
  doublePrecision,
  date,
} from 'drizzle-orm/pg-core';
export * from './territorial-schema.js';
import type {
  SessionUser,
  Occurrence,
  CivicItem,
} from '../../shared/contracts.js';
export const municipalities = pgTable('municipalities', {
  id: text('id').primaryKey(),
  data: jsonb('data')
    .$type<import('../../shared/contracts.js').Municipality>()
    .notNull(),
  geometry: jsonb('geometry')
    .$type<import('./municipality.js').Geometry>()
    .notNull(),
});
export const postalCodes = pgTable('postal_codes', {
  postalCode: text('postal_code').primaryKey(),
  data: jsonb('data')
    .$type<import('../../shared/contracts.js').PostalCodeLookup>()
    .notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  email: text('email').notNull().unique(),
  role: text('role').$type<SessionUser['role']>().notNull(),
  sector: text('sector'),
  municipalityId: text('municipality_id').references(() => municipalities.id),
  postalCode: text('postal_code'),
  neighborhood: text('neighborhood'),
  passwordHash: text('password_hash').notNull(),
});
export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const records = pgTable('records', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  municipalityId: text('municipality_id')
    .notNull()
    .references(() => municipalities.id),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id),
  data: jsonb('data').$type<Occurrence | CivicItem>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const relations = pgTable(
  'relations',
  {
    recordId: text('record_id')
      .notNull()
      .references(() => records.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
  },
  (t) => [primaryKey({ columns: [t.recordId, t.userId, t.kind] })],
);
export const answers = pgTable(
  'answers',
  {
    recordId: text('record_id')
      .notNull()
      .references(() => records.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    option: integer('option').notNull(),
  },
  (t) => [primaryKey({ columns: [t.recordId, t.userId] })],
);
export const attachments = pgTable('attachments', {
  id: text('id').primaryKey(),
  mime: text('mime').notNull(),
  municipalityId: text('municipality_id')
    .notNull()
    .references(() => municipalities.id),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Scenario baseline is separate from attributable citizen interactions.
export const demoEngagement = pgTable('demo_engagement', {
  recordId: text('record_id')
    .primaryKey()
    .references(() => records.id, { onDelete: 'cascade' }),
  views: integer('views').notNull(),
  supports: integer('supports').notNull(),
});

export const officialCalls = pgTable('official_calls', {
  id: text('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  source: text('source').notNull().default('rio1746'),
  municipalityId: text('municipality_id').notNull().default('3304557'),
  serviceCategory: text('service_category'),
  serviceType: text('service_type').notNull(),
  serviceSubtype: text('service_subtype').notNull(),
  organizationName: text('organization_name'),
  officialStatus: text('official_status'),
  officialSituation: text('official_situation'),
  officialSituationType: text('official_situation_type'),
  statusJustification: text('status_justification'),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  targetDate: timestamp('target_date', { withTimezone: true }),
  withinDeadline: text('within_deadline'),
  timeRemaining: integer('time_remaining'),
  timeUnit: text('time_unit'),
  neighborhoodId: text('neighborhood_id'),
  neighborhoodName: text('neighborhood_name'),
  subprefecture: text('subprefecture'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  sourcePartitionDate: date('source_partition_date'),
  importedAt: timestamp('imported_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const syncCheckpoints = pgTable('sync_checkpoints', {
  id: text('id').primaryKey(),
  lastPartition: text('last_partition'),
  recordsImported: integer('records_imported').notNull().default(0),
  recordsUpdated: integer('records_updated').notNull().default(0),
  status: text('status').notNull().default('idle'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  errorMessage: text('error_message'),
});

export const sourceSyncRuns = pgTable('source_sync_runs', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  status: text('status')
    .$type<import('../../shared/contracts.js').SyncRunSummary['status']>()
    .notNull(),
  coverage: text('coverage')
    .$type<import('../../shared/contracts.js').SyncCoverage>()
    .notNull(),
  requestedStart: date('requested_start'),
  requestedEnd: date('requested_end'),
  startedAt: timestamp('started_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  receivedCount: integer('received_count').notNull().default(0),
  importedCount: integer('imported_count').notNull().default(0),
  updatedCount: integer('updated_count').notNull().default(0),
  rejectedCount: integer('rejected_count').notNull().default(0),
  details: jsonb('details').notNull().default({}),
});
