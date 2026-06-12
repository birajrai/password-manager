import type { APIRoute } from 'astro';
import { hashPassword, createUser, createSession, findUserByPhone } from '../../lib/auth';
import { deriveKey, generateSalt, encryptDerivedKey, getSecretKey } from '../../lib/crypto';
import { verifyTurnstile } from '../../lib/turnstile';
import { checkRateLimit } from '../../lib/rate-limit';
import { validatePhone, validatePassword, validateTurnstileToken, getClientIp } from '../../lib/helpers';
import { db } from '../../lib/db';
import { keyDerivation } from '../../lib/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies, clientAddress }) => {
  const formData = await request.formData();
  const phone = formData.get('phone') as string | null;
  const password = formData.get('password') as string | null;
  const turnstileToken = formData.get('cf-turnstile-response');

  if (!phone || !password || !validateTurnstileToken(turnstileToken)) {
    return redirect('/register?error=All+fields+are+required');
  }

  const normalizedPhone = phone.trim();

  if (!validatePhone(normalizedPhone)) {
    return redirect('/register?error=Invalid+phone+number+format');
  }

  const pwError = validatePassword(password);
  if (pwError) {
    return redirect(`/register?error=${encodeURIComponent(pwError)}`);
  }

  const ip = getClientIp(request) ?? clientAddress;
  if (!checkRateLimit(`register:${ip ?? 'unknown'}`, 3, 3600000)) {
    return redirect('/register?error=Too+many+attempts.+Try+again+later');
  }

  const verified = await verifyTurnstile(turnstileToken, ip);
  if (!verified) {
    return redirect('/register?error=Captcha+verification+failed');
  }

  const existing = await findUserByPhone(normalizedPhone);
  if (existing) {
    return redirect('/register?error=Phone+number+already+registered');
  }

  const authHash = await hashPassword(password);
  const salt = generateSalt();
  const iterations = 600000;
  const derivedKey = deriveKey(password, salt, iterations);
  const secretKey = getSecretKey();

  const encrypted = encryptDerivedKey(derivedKey, secretKey);

  const user = await createUser(normalizedPhone, authHash);

  await db.insert(keyDerivation).values({
    userId: user.id,
    salt,
    iterations,
  });

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
