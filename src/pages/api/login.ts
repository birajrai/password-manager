import type { APIRoute } from 'astro';
import { verifyPassword, findUserByPhone, createSession, deleteUserSessions } from '../../lib/auth';
import { deriveKey, encryptDerivedKey, getSecretKey } from '../../lib/crypto';
import { verifyTurnstile } from '../../lib/turnstile';
import { checkRateLimit } from '../../lib/rate-limit';
import { validatePhone, validatePassword, validateTurnstileToken, getClientIp } from '../../lib/helpers';
import { db } from '../../lib/db';
import { keyDerivation } from '../../lib/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies, clientAddress }) => {
  const formData = await request.formData();
  const phone = formData.get('phone') as string | null;
  const password = formData.get('password') as string | null;
  const turnstileToken = formData.get('cf-turnstile-response');

  if (!phone || !password || !validateTurnstileToken(turnstileToken)) {
    return redirect('/login?error=All+fields+are+required');
  }

  const normalizedPhone = phone.trim();

  if (!validatePhone(normalizedPhone)) {
    return redirect('/login?error=Invalid+phone+number+format');
  }

  const pwError = validatePassword(password);
  if (pwError) {
    return redirect(`/login?error=${encodeURIComponent(pwError)}`);
  }

  const ip = getClientIp(request) ?? clientAddress;
  if (!checkRateLimit(`login:${normalizedPhone}`, 5, 60000)) {
    return redirect('/login?error=Too+many+attempts.+Try+again+later');
  }

  const verified = await verifyTurnstile(turnstileToken, ip);
  if (!verified) {
    return redirect('/login?error=Captcha+verification+failed');
  }

  const user = await findUserByPhone(normalizedPhone);
  if (!user) {
    return redirect('/login?error=Invalid+credentials');
  }

  const valid = await verifyPassword(user.authHash, password);
  if (!valid) {
    return redirect('/login?error=Invalid+credentials');
  }

  const kd = await db
    .select()
    .from(keyDerivation)
    .where(eq(keyDerivation.userId, user.id))
    .limit(1);

  if (!kd[0]) {
    return redirect('/login?error=Account+corrupted.+Contact+support');
  }

  const derivedKey = deriveKey(password, kd[0].salt, kd[0].iterations);
  const secretKey = getSecretKey();
  const encrypted = encryptDerivedKey(derivedKey, secretKey);

  await deleteUserSessions(user.id);

  const token = await createSession(
    user.id,
    encrypted.ciphertext,
    encrypted.iv,
    encrypted.tag
  );

  cookies.set('session_token', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  return redirect('/vault');
};
