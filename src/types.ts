import type { users, sessions, keyDerivation } from './lib/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type KeyDerivation = InferSelectModel<typeof keyDerivation>;

declare global {
  namespace App {
    interface Locals {
      session: Session | null;
      userId: string | null;
    }
  }
}
