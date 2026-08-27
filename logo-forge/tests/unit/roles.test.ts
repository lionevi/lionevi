import { describe, expect, it } from 'vitest';
import { guessBrandName } from '@core/illustrator/document';
import { inferRole } from '@core/illustrator/roles';

describe('inferRole', () => {
  it.each([
    ['Logo horizontal', 'horizontal'],
    ['Version verticale', 'stacked'],
    ['Icone seule', 'icon'],
    ['Favicon 32', 'favicon'],
    ['Monogramme AC', 'monogram'],
    ['Logotype texte', 'wordmark'],
    ['Logo principal', 'primary'],
  ] as const)('classe « %s » comme %s', (name, role) => {
    expect(inferRole(name)).toBe(role);
  });

  it('teste du plus specifique au plus general', () => {
    expect(inferRole('Icone favicon')).toBe('favicon');
  });

  it('considere le premier plan de travail comme le principal', () => {
    expect(inferRole('Plan 1', 0)).toBe('primary');
    expect(inferRole('Plan 2', 1)).toBe('other');
  });
});

describe('guessBrandName', () => {
  it('retire l extension et les suffixes de travail', () => {
    expect(guessBrandName('acme-logo-final-v2.ai')).toBe('acme');
    expect(guessBrandName('Ma Marque_logo.ai')).toBe('Ma Marque');
  });

  it('retombe sur une valeur par defaut', () => {
    expect(guessBrandName('logo.ai')).toBe('Marque');
  });
});
