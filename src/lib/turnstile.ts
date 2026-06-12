const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
  token: string,
  ip: string | null
): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET!);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.success === true;
}
