import type { APIRoute } from 'astro';
import { decryptDerivedKey, encryptVaultPassword } from '../../../lib/crypto';
import { sanitizeUrl } from '../../../lib/helpers';
import { db } from '../../../lib/db';
import { vaultEntries } from '../../../lib/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies, locals }) => {
  const session = locals.session;
  if (!session) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const title = ((formData.get('title') as string) ?? '').trim();
  let url = ((formData.get('url') as string) ?? '').trim();
  const username = ((formData.get('username') as string) ?? '').trim();
  const password = formData.get('password') as string | null;
  const category = ((formData.get('category') as string) ?? '').trim();

  if (!title) {
    return redirect('/vault/new?error=Title+is+required');
  }

  if (!password || password.length > 4096) {
    return redirect('/vault/new?error=Invalid+password');
  }

  if (url) {
    const sanitized = sanitizeUrl(url);
    if (sanitized === null) {
      return redirect('/vault/new?error=Invalid+URL');
    }
    url = sanitized;
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
    url,
    username,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: encrypted.tag,
    category,
  });

  return redirect('/vault');
};
