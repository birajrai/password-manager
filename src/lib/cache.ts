interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}, 60_000);

if (cleanup.unref) cleanup.unref();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}
