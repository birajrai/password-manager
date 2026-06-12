import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { db } from './db';
import { sessions, users } from './schema';
import { eq } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDelete } from './cache';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function findUserByPhone(phone: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(phone: string, authHash: string) {
  const result = await db
    .insert(users)
    .values({ phone, authHash })
    .returning();
  return result[0]!;
}

export async function createSession(
  userId: string,
  encryptedKey: string,
  encryptedKeyIv: string,
  encryptedKeyTag: string
): Promise<string> {
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    userId,
    token,
    encryptedKey,
    encryptedKeyIv,
    encryptedKeyTag,
    expiresAt,
  });
  return token;
}

export async function findSession(token: string) {
  const cached = cacheGet<typeof sessions.$inferSelect>(`session:${token}`);
  if (cached) return cached;

  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);
  const session = result[0] ?? null;
  if (!session) return null;
  if (new Date() > session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }
  cacheSet(`session:${token}`, session, 60_000);
  return session;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
  cacheDelete(`session:${token}`);
}

export async function deleteUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function touchSession(token: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.token, token));
  cacheDelete(`session:${token}`);
}
