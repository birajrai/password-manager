import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull().unique(),
  authHash: text('auth_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  encryptedKey: text('encrypted_key').notNull(),
  encryptedKeyIv: text('encrypted_key_iv').notNull(),
  encryptedKeyTag: text('encrypted_key_tag').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const vaultEntries = pgTable('vault_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').default(''),
  username: text('username').default(''),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  tag: text('tag').notNull(),
  category: text('category').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const keyDerivation = pgTable('key_derivation', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  salt: text('salt').notNull(),
  iterations: integer('iterations').notNull().default(600000),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
