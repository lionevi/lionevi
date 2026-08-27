import type { LogoAsset, SizeSpec, SizeUnit } from '@/types';

const POINTS_PER_INCH = 72;

export function unitToInches(value: number, unit: SizeUnit, dpi: number): number {
  switch (unit) {
    case 'in':
      return value;
    case 'mm':
      return value / 25.4;
    case 'pt':
      return value / POINTS_PER_INCH;
    case 'px':
      return value / dpi;
  }
}

export interface PixelSize {
  width: number;
  height: number;
}

/**
 * Convertit une specification de taille en pixels reels.
 *
 * Les dimensions du plan de travail sont exprimees en points ; a 72 ppp un
 * point vaut exactement un pixel, ce qui donne la taille de reference.
 */
export function resolvePixelSize(size: SizeSpec, asset: LogoAsset, dpi = 72): PixelSize {
  const ratio = asset.height === 0 ? 1 : asset.width / asset.height;
  const baseWidth = (asset.width / POINTS_PER_INCH) * dpi;
  const baseHeight = (asset.height / POINTS_PER_INCH) * dpi;

  switch (size.mode) {
    case 'scale': {
      return round({ width: baseWidth * size.value, height: baseHeight * size.value });
    }
    case 'width': {
      const width = unitToInches(size.value, size.unit, dpi) * dpi;
      return round({ width, height: width / ratio });
    }
    case 'height': {
      const height = unitToInches(size.value, size.unit, dpi) * dpi;
      return round({ width: height * ratio, height });
    }
    case 'longest-edge': {
      const longest = unitToInches(size.value, size.unit, dpi) * dpi;
      return ratio >= 1
        ? round({ width: longest, height: longest / ratio })
        : round({ width: longest * ratio, height: longest });
    }
    case 'exact': {
      return round({
        width: unitToInches(size.value, size.unit, dpi) * dpi,
        height: unitToInches(size.height ?? size.value, size.unit, dpi) * dpi,
      });
    }
  }
}

function round(size: PixelSize): PixelSize {
  return {
    width: Math.max(1, Math.round(size.width)),
    height: Math.max(1, Math.round(size.height)),
  };
}

/**
 * Facteur d echelle a transmettre a Illustrator, exprime en pourcentage de la
 * taille du plan de travail a 72 ppp — c est l unite attendue par
 * `ExportOptionsPNG24.horizontalScale`.
 */
export function scalePercent(target: PixelSize, asset: LogoAsset): number {
  if (asset.width === 0) return 100;
  return (target.width / asset.width) * 100;
}

/**
 * Mise a l echelle du logo a l interieur d un canvas fixe, en respectant la
 * zone de securite. Retourne la taille du logo et son decalage pour le centrer.
 */
export function fitInside(
  canvas: PixelSize,
  asset: LogoAsset,
  safeArea = 1,
): { width: number; height: number; offsetX: number; offsetY: number } {
  const available = { width: canvas.width * safeArea, height: canvas.height * safeArea };
  const ratio = asset.height === 0 ? 1 : asset.width / asset.height;
  let width = available.width;
  let height = width / ratio;
  if (height > available.height) {
    height = available.height;
    width = height * ratio;
  }
  return {
    width: Math.round(width),
    height: Math.round(height),
    offsetX: Math.round((canvas.width - width) / 2),
    offsetY: Math.round((canvas.height - height) / 2),
  };
}
