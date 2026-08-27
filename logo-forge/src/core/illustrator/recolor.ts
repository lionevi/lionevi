import type { ColorVariant } from '@/types';
import { hexToRgb } from '@core/variants/contrast';

/**
 * Strategie de recoloration appliquee a une copie du document avant export.
 *
 * Logo Forge ne modifie jamais le document de l utilisateur : chaque variante
 * travaille sur un duplicata temporaire, ferme sans enregistrement une fois les
 * fichiers ecrits. C est la seule maniere sure de garantir qu un export rate ne
 * laisse pas un document a moitie recolore.
 */
export type RecolorStrategy =
  | { kind: 'none' }
  | { kind: 'flat'; rgb: { r: number; g: number; b: number } }
  | { kind: 'grayscale' };

export function strategyFor(variant: ColorVariant): RecolorStrategy {
  switch (variant.kind) {
    case 'primary':
    case 'inverted':
      return { kind: 'none' };
    case 'grayscale':
      return { kind: 'grayscale' };
    case 'monochrome-black':
    case 'monochrome-white':
    case 'custom': {
      const rgb = hexToRgb(variant.color ?? '#000000');
      return rgb ? { kind: 'flat', rgb } : { kind: 'none' };
    }
  }
}

/** Conversion en luminance perceptuelle, identique a celle d Illustrator. */
export function toGray(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}
