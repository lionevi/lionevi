import type { NameCase, NamingScheme, PlanWarning } from '@/types';
import { isNameToken, resolveToken, type NameContext } from './tokens';

const TOKEN_PATTERN = /\{([a-zA-Z]+)\}/g;

/** Caracteres interdits par Windows, macOS ou les archives ZIP. */
const ILLEGAL_CHARS = /[<>:"/\\|?* ]/g;

const DIACRITICS = /[\u0300-\u036f]/g;
const NON_ASCII = /[^\x20-\x7e]/g;

/** Noms reserves par Windows : un fichier « con.png » y est impossible a creer. */
const RESERVED_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
]);

export function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(DIACRITICS, '');
}

/** Decoupe une chaine en mots, en respectant les frontieres camelCase. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
}

export function applyCase(input: string, mode: NameCase): string {
  if (mode === 'original') return input.trim();
  const words = splitWords(input);
  if (words.length === 0) return '';
  switch (mode) {
    case 'kebab':
      return words.map((w) => w.toLowerCase()).join('-');
    case 'snake':
      return words.map((w) => w.toLowerCase()).join('_');
    case 'camel':
      return words
        .map((w, i) => (i === 0 ? w.toLowerCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase()))
        .join('');
    case 'pascal':
      return words.map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
}

/** Rend un segment de chemin sur pour les trois OS et pour une archive ZIP. */
export function sanitizeSegment(input: string, scheme: NamingScheme): string {
  let value = scheme.asciiOnly ? stripDiacritics(input) : input;
  value = value.replace(ILLEGAL_CHARS, ' ');
  if (scheme.asciiOnly) value = value.replace(NON_ASCII, ' ');
  value = applyCase(value, scheme.case);
  // Un separateur double, en tete ou en queue est toujours l'artefact d'un token vide.
  value = value.replace(/[-_]{2,}/g, (m) => m[0]!).replace(/^[-_.]+|[-_.]+$/g, '');
  if (value.length > scheme.maxLength) {
    value = value.slice(0, scheme.maxLength).replace(/[-_.]+$/, '');
  }
  if (RESERVED_NAMES.has(value.toLowerCase())) value = `${value}-file`;
  return value;
}

export interface RenderResult {
  name: string;
  warnings: PlanWarning[];
}

/**
 * Applique un gabarit de nommage. Un token inconnu est remplace par une chaine
 * vide et signale : mieux vaut un pack complet assorti d'un avertissement qu'un
 * export interrompu au 300e fichier.
 */
export function renderName(template: string, ctx: NameContext, scheme: NamingScheme): RenderResult {
  const warnings: PlanWarning[] = [];
  const raw = template.replace(TOKEN_PATTERN, (_match, rawToken: string) => {
    const token = rawToken.toLowerCase();
    if (!isNameToken(token)) {
      warnings.push({
        code: 'unknown-token',
        severity: 'warning',
        message: `Token inconnu « {${rawToken}} » dans le gabarit de nommage.`,
      });
      return '';
    }
    return resolveToken(token, ctx);
  });

  const name = sanitizeSegment(raw, scheme);
  return { name: name || 'logo', warnings };
}

/**
 * Garantit l'unicite d'un chemin en suffixant `-2`, `-3`… La comparaison est
 * insensible a la casse car HFS+ et NTFS le sont : deux noms ne differant que
 * par la casse s'ecraseraient silencieusement.
 */
export function uniquePath(taken: Set<string>, filePath: string): string {
  const key = filePath.toLowerCase();
  if (!taken.has(key)) {
    taken.add(key);
    return filePath;
  }
  const dot = filePath.lastIndexOf('.');
  const base = dot === -1 ? filePath : filePath.slice(0, dot);
  const ext = dot === -1 ? '' : filePath.slice(dot);
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}${ext}`;
    if (!taken.has(candidate.toLowerCase())) {
      taken.add(candidate.toLowerCase());
      return candidate;
    }
  }
  throw new Error(`Impossible de rendre unique le chemin « ${filePath} ».`);
}
