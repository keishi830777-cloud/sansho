export interface Preferences { muted: boolean; volume: number; reducedMotion: boolean }
export function readValue<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value) as T; } catch { return fallback; }
}
export function saveValue(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private modes can forbid storage; play remains available. */ } }
export function preferences(): Preferences {
  const raw = readValue<Partial<Preferences> | null>('ouo-settings', null);
  return { muted: typeof raw?.muted === 'boolean' ? raw.muted : false, volume: typeof raw?.volume === 'number' && Number.isFinite(raw.volume) ? Math.max(0, Math.min(1, raw.volume)) : 0.45, reducedMotion: typeof raw?.reducedMotion === 'boolean' ? raw.reducedMotion : matchMedia('(prefers-reduced-motion: reduce)').matches };
}
export function bestScore(): number { const best = readValue<unknown>('ouo-best', 0); return typeof best === 'number' && Number.isFinite(best) ? Math.max(0, best) : 0; }
