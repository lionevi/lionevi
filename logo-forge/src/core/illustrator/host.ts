import type { IllustratorModule } from '@/types/illustrator';

type UxpRequire = (moduleName: string) => unknown;

function hostRequire(): UxpRequire | null {
  const candidate = (globalThis as { require?: unknown }).require;
  return typeof candidate === 'function' ? (candidate as UxpRequire) : null;
}

/**
 * Charge un module fourni par l hote UXP. Retourne `null` hors d Illustrator
 * (tests, previsualisation navigateur), ce qui permet a toute la couche metier
 * de fonctionner sans l application.
 */
export function requireHostModule<T>(name: string): T | null {
  const req = hostRequire();
  if (!req) return null;
  try {
    return req(name) as T;
  } catch {
    return null;
  }
}

let cachedIllustrator: IllustratorModule | null | undefined;

export function getIllustrator(): IllustratorModule | null {
  if (cachedIllustrator === undefined) {
    cachedIllustrator = requireHostModule<IllustratorModule>('illustrator');
  }
  return cachedIllustrator;
}

export function isRunningInIllustrator(): boolean {
  return getIllustrator() !== null;
}

/** Reinitialise le cache — utilise par les tests. */
export function resetHostCache(): void {
  cachedIllustrator = undefined;
}
