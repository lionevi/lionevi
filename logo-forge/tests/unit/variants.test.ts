import { describe, expect, it } from 'vitest';
import { contrastRatio, hasSufficientContrast, hexToRgb, relativeLuminance } from '@core/variants';
import { strategyFor, toGray } from '@core/illustrator/recolor';
import { cloneDefaultVariants } from '@core/variants';

describe('hexToRgb', () => {
  it('accepte les notations courtes et longues', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('2680EB')).toEqual({ r: 38, g: 128, b: 235 });
  });

  it('rejette une valeur invalide', () => {
    expect(hexToRgb('bleu')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('donne 21 pour noir sur blanc', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('donne 1 pour deux couleurs identiques', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('est symetrique', () => {
    expect(contrastRatio('#ffffff', '#767676')).toBeCloseTo(
      contrastRatio('#767676', '#ffffff')!,
      5,
    );
  });

  it('refuse un logo blanc sur fond blanc', () => {
    expect(hasSufficientContrast('#ffffff', '#fefefe')).toBe(false);
  });

  it('ne bloque pas quand la couleur est illisible', () => {
    expect(hasSufficientContrast('inconnu', '#ffffff')).toBe(true);
  });
});

describe('relativeLuminance', () => {
  it('borne la luminance entre 0 et 1', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});

describe('strategyFor', () => {
  const variants = cloneDefaultVariants();

  it('laisse la version couleur intacte', () => {
    expect(strategyFor(variants.find((v) => v.kind === 'primary')!)).toEqual({ kind: 'none' });
  });

  it('aplatit les declinaisons monochromes sur leur couleur', () => {
    expect(strategyFor(variants.find((v) => v.kind === 'monochrome-white')!)).toEqual({
      kind: 'flat',
      rgb: { r: 255, g: 255, b: 255 },
    });
  });

  it('bascule en niveaux de gris', () => {
    expect(strategyFor(variants.find((v) => v.kind === 'grayscale')!)).toEqual({
      kind: 'grayscale',
    });
  });
});

describe('toGray', () => {
  it('applique la ponderation perceptuelle', () => {
    expect(toGray(255, 255, 255)).toBe(255);
    expect(toGray(0, 255, 0)).toBe(150);
  });
});
