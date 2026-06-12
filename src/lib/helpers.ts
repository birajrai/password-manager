const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function validatePassword(password: string): string | null {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be at most 128 characters';
  return null;
}

export function sanitizeUrl(url: string): string | null {
  if (!url || url.trim() === '') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (!trimmed.includes('://') && !trimmed.startsWith('#')) {
    return `https://${trimmed}`;
  }
  return null;
}

export function validateTurnstileToken(token: unknown): token is string {
  return typeof token === 'string' && token.length > 0;
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? null;
}
