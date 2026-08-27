import { en } from './en';
import { fr, type TranslationKey } from './fr';

export type Locale = 'fr' | 'en';

const CATALOGS: Record<Locale, Record<TranslationKey, string>> = { fr, en };

let activeLocale: Locale = 'fr';

export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getLocale(): Locale {
  return activeLocale;
}

/** Detecte la langue de l hote, avec repli sur le francais. */
export function detectLocale(navigatorLanguage?: string): Locale {
  return navigatorLanguage?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function t(key: TranslationKey): string {
  return CATALOGS[activeLocale][key] ?? CATALOGS.fr[key] ?? key;
}

export type { TranslationKey };
