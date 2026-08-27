import type { ColorVariant, ExportTarget, LogoAsset } from '@/types';

/** Tokens acceptes dans un gabarit de nommage. */
export const NAME_TOKENS = [
  'brand',
  'asset',
  'role',
  'variant',
  'variantkind',
  'format',
  'profile',
  'size',
  'width',
  'height',
  'dpi',
  'preset',
  'date',
  'index',
] as const;

export type NameToken = (typeof NAME_TOKENS)[number];

export interface NameContext {
  brand: string;
  asset: LogoAsset;
  variant: ColorVariant;
  target: ExportTarget;
  pixelSize?: { width: number; height: number };
  index: number;
  /** Injectable pour rendre les tests deterministes. */
  now?: Date;
}

function sizeLabel(ctx: NameContext): string {
  const { size } = ctx.target;
  if (ctx.pixelSize) {
    return size.mode === 'exact'
      ? `${ctx.pixelSize.width}x${ctx.pixelSize.height}`
      : `${ctx.pixelSize.width}px`;
  }
  if (size.mode === 'scale') return `${size.value}x`;
  return `${size.value}${size.unit}`;
}

export function resolveToken(token: NameToken, ctx: NameContext): string {
  switch (token) {
    case 'brand':
      return ctx.brand;
    case 'asset':
      return ctx.asset.name;
    case 'role':
      return ctx.asset.role;
    case 'variant':
      return ctx.variant.label;
    case 'variantkind':
      return ctx.variant.kind;
    case 'format':
      return ctx.target.format;
    case 'profile':
      return ctx.target.colorProfile;
    case 'size':
      return sizeLabel(ctx);
    case 'width':
      return ctx.pixelSize ? String(ctx.pixelSize.width) : '';
    case 'height':
      return ctx.pixelSize ? String(ctx.pixelSize.height) : '';
    case 'dpi':
      return String(ctx.target.raster?.dpi ?? '');
    case 'preset':
      return ctx.target.folder.split('/')[0] ?? '';
    case 'date':
      return (ctx.now ?? new Date()).toISOString().slice(0, 10);
    case 'index':
      return String(ctx.index + 1).padStart(2, '0');
  }
}

export function isNameToken(value: string): value is NameToken {
  return (NAME_TOKENS as readonly string[]).includes(value);
}
