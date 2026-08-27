import type { LogoRole } from '@/types';

/**
 * Deduction du role d une declinaison a partir du nom du plan de travail.
 *
 * Les designers nomment leurs plans de travail en francais comme en anglais :
 * on couvre les deux, en testant du plus specifique au plus general pour que
 * « icone-favicon » ne soit pas classe « icon ».
 */
const ROLE_PATTERNS: readonly { role: LogoRole; pattern: RegExp }[] = [
  { role: 'favicon', pattern: /favicon/i },
  { role: 'monogram', pattern: /monogram|monogramme|initial/i },
  { role: 'wordmark', pattern: /wordmark|typographi|logotype|texte|word/i },
  { role: 'icon', pattern: /\bicon|icone|symbol|symbole|mark\b|picto/i },
  { role: 'horizontal', pattern: /horizontal|paysage|landscape|wide|large/i },
  { role: 'stacked', pattern: /stacked|vertical|empil|portrait|centr/i },
  { role: 'lockup', pattern: /lockup|verrouill|signature|ensemble/i },
  { role: 'primary', pattern: /primary|principal|main|master|primaire/i },
];

export function inferRole(artboardName: string, index = 0): LogoRole {
  for (const { role, pattern } of ROLE_PATTERNS) {
    if (pattern.test(artboardName)) return role;
  }
  return index === 0 ? 'primary' : 'other';
}

export const ROLE_LABELS: Record<LogoRole, string> = {
  primary: 'Principal',
  horizontal: 'Horizontal',
  stacked: 'Vertical',
  icon: 'Icone',
  wordmark: 'Logotype',
  monogram: 'Monogramme',
  lockup: 'Lockup',
  favicon: 'Favicon',
  other: 'Autre',
};
