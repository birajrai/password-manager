import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { vaultEntries } from '../../../../lib/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, locals, params }) => {
  const session = locals.session;
  if (!session) {
    return redirect('/login');
  }

  const id = params.id;
  if (!id) {
    return redirect('/vault');
  }

  const entry = await db
    .select()
    .from(vaultEntries)
    .where(eq(vaultEntries.id, id))
    .limit(1);

  if (!entry[0] || entry[0].userId !== session.userId) {
    return redirect('/vault');
  }

  await db.delete(vaultEntries).where(eq(vaultEntries.id, id));

  return redirect('/vault');
};
