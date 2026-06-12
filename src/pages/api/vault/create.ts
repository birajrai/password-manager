import type { APIRoute } from 'astro';
import { decryptDerivedKey, encryptVaultPassword } from '../../../lib/crypto';
import { db } from '../../../lib/db';
import { vaultEntries } from '../../../lib/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies, locals }) => {
  const session = locals.session;
  if (!session) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const title = formData.get('title') as string | null;
  const url = formData.get('url') as string | null;
  const username = formData.get('username') as string | null;
  const password = formData.get('password') as string | null;
  const category = formData.get('category') as string | null;

  if (!title || !password) {
    return redirect('/vault/new?error=Title+and+password+are+required');
  }

  const secretKey = Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex');
  const vaultKey = decryptDerivedKey(
    {
      ciphertext: session.encryptedKey,
      iv: session.encryptedKeyIv,
      tag: session.encryptedKeyTag,
    },
    secretKey
  );

  const encrypted = encryptVaultPassword(password, vaultKey);

  await db.insert(vaultEntries).values({
    userId: session.userId,
    title,
    url: url ?? '',
    username: username ?? '',
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: encrypted.tag,
    category: category ?? '',
  });

  return redirect('/vault');
};
