import type { ColorVariant } from '@/types';

/**
 * Les cinq declinaisons attendues dans toute charte serieuse. « Blanc » et
 * « Couleur sur fond sombre » sont desactivees par defaut : elles n ont de sens
 * qu accompagnees d un fond, sans quoi l export est un carre transparent.
 */
export const DEFAULT_VARIANTS: readonly ColorVariant[] = [
  {
    id: 'primary',
    label: 'Couleur',
    kind: 'primary',
    background: null,
    enabled: true,
  },
  {
    id: 'black',
    label: 'Noir',
    kind: 'monochrome-black',
    color: '#000000',
    background: null,
    enabled: true,
  },
  {
    id: 'white',
    label: 'Blanc',
    kind: 'monochrome-white',
    color: '#FFFFFF',
    background: null,
    enabled: true,
  },
  {
    id: 'grayscale',
    label: 'Nuances de gris',
    kind: 'grayscale',
    background: null,
    enabled: false,
  },
  {
    id: 'on-dark',
    label: 'Couleur sur fond sombre',
    kind: 'inverted',
    background: '#111111',
    enabled: false,
  },
];

export function cloneDefaultVariants(): ColorVariant[] {
  return DEFAULT_VARIANTS.map((v) => ({ ...v }));
}
