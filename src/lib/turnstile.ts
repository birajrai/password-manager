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

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return false;

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}
