/**
 * Controle de contraste WCAG 2.1 applique aux couples logo / fond.
 *
 * Un pack qui livre un logo blanc sur fond transparent finit invariablement
 * colle sur une page blanche : le plan signale ces combinaisons avant l export
 * plutot qu apres la livraison au client.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: Rgb): number {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

/** Rapport de contraste WCAG, entre 1 (identique) et 21 (noir sur blanc). */
export function contrastRatio(foreground: string, background: string): number | null {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return null;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

/** Seuil WCAG AA pour les elements graphiques non textuels. */
export const MIN_GRAPHIC_CONTRAST = 3;

export function hasSufficientContrast(foreground: string, background: string): boolean {
  const ratio = contrastRatio(foreground, background);
  return ratio === null ? true : ratio >= MIN_GRAPHIC_CONTRAST;
}
