import { describe, expect, it } from 'vitest';
import type { NamingScheme } from '@/types';
import { applyCase, renderName, sanitizeSegment, splitWords, uniquePath } from '@core/naming';
import { DEFAULT_NAMING } from '@core/defaults';
import { cloneDefaultVariants } from '@core/variants';
import { BUILTIN_PRESETS } from '@core/presets';
import { FIXED_DATE, makeAsset } from '../fixtures/settings';

const scheme: NamingScheme = { ...DEFAULT_NAMING };

describe('splitWords', () => {
  it('respecte les frontieres camelCase', () => {
    expect(splitWords('monLogoPrincipal')).toEqual(['mon', 'Logo', 'Principal']);
  });

  it('ignore les separateurs multiples', () => {
    expect(splitWords('logo -- principal__v2')).toEqual(['logo', 'principal', 'v2']);
  });
});

describe('applyCase', () => {
  it.each([
    ['kebab', 'mon-logo-principal'],
    ['snake', 'mon_logo_principal'],
    ['camel', 'monLogoPrincipal'],
    ['pascal', 'MonLogoPrincipal'],
  ] as const)('produit la casse %s', (mode, expected) => {
    expect(applyCase('Mon Logo Principal', mode)).toBe(expected);
  });

  it('laisse le nom intact en mode original', () => {
    expect(applyCase('  Mon Logo  ', 'original')).toBe('Mon Logo');
  });
});

describe('sanitizeSegment', () => {
  it('translitere les accents quand asciiOnly est actif', () => {
    expect(sanitizeSegment('Café Crème', scheme)).toBe('cafe-creme');
  });

  it('supprime les caracteres interdits par les systemes de fichiers', () => {
    expect(sanitizeSegment('logo:v1/final?', scheme)).toBe('logo-v1-final');
  });

  it('desamorce les noms reserves par Windows', () => {
    expect(sanitizeSegment('con', scheme)).toBe('con-file');
  });

  it('tronque au-dela de la longueur maximale sans laisser de separateur', () => {
    const short = { ...scheme, maxLength: 8 };
    expect(sanitizeSegment('logo principal couleur', short)).toBe('logo-pri');
  });
});

describe('renderName', () => {
  const target = BUILTIN_PRESETS.find((p) => p.id === 'web')!.targets[1]!;
  const variant = cloneDefaultVariants()[0]!;

  it('remplace les tokens connus', () => {
    const result = renderName(
      '{brand}-{asset}-{variant}-{format}',
      { brand: 'Acme', asset: makeAsset(), variant, target, index: 0, now: FIXED_DATE },
      scheme,
    );
    expect(result.name).toBe('acme-logo-principal-couleur-png');
    expect(result.warnings).toHaveLength(0);
  });

  it('signale un token inconnu sans faire echouer le rendu', () => {
    const result = renderName(
      '{brand}-{inconnu}',
      { brand: 'Acme', asset: makeAsset(), variant, target, index: 0, now: FIXED_DATE },
      scheme,
    );
    expect(result.name).toBe('acme');
    expect(result.warnings[0]?.code).toBe('unknown-token');
  });

  it('retombe sur « logo » quand le gabarit ne produit rien', () => {
    const result = renderName(
      '{inconnu}',
      { brand: 'Acme', asset: makeAsset(), variant, target, index: 0, now: FIXED_DATE },
      scheme,
    );
    expect(result.name).toBe('logo');
  });
});

describe('uniquePath', () => {
  it('suffixe les doublons en conservant l extension', () => {
    const taken = new Set<string>();
    expect(uniquePath(taken, 'web/logo.png')).toBe('web/logo.png');
    expect(uniquePath(taken, 'web/logo.png')).toBe('web/logo-2.png');
    expect(uniquePath(taken, 'web/logo.png')).toBe('web/logo-3.png');
  });

  it('traite les collisions de casse comme des doublons', () => {
    const taken = new Set<string>();
    uniquePath(taken, 'web/Logo.png');
    expect(uniquePath(taken, 'web/logo.png')).toBe('web/logo-2.png');
  });
});
