const store = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => now - t < 60000);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
  }
}, 60_000);

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const timestamps = store.get(key) ?? [];
  const valid = timestamps.filter((t) => t > cutoff);

  if (valid.length >= maxAttempts) {
    return false;
  }

  valid.push(now);
  store.set(key, valid);
  return true;
}
