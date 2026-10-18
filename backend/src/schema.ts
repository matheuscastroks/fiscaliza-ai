import {
  pgTable,
  text,
  timestamp,
  jsonb,
  primaryKey,
  integer,
} from 'drizzle-orm/pg-core';
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
