import type { ExportTarget, Preset, SizeSpec } from '@/types';
import { APP_ICON_SIZES, FAVICON_SIZES, SOCIAL_SIZES } from './social';

function scale(value: number): SizeSpec {
  return { mode: 'scale', value, unit: 'px' };
}

function longest(value: number): SizeSpec {
  return { mode: 'longest-edge', value, unit: 'px' };
}

function exact(width: number, height: number): SizeSpec {
  return { mode: 'exact', value: width, height, unit: 'px' };
}

type TargetInput = Pick<ExportTarget, 'id' | 'label' | 'format' | 'folder' | 'size'> &
  Partial<ExportTarget>;

function target(input: TargetInput): ExportTarget {
  return {
    colorProfile: 'rgb',
    enabled: true,
    ...input,
  };
}

/** 01 — fichiers sources, ceux qu on transmet a une imprimerie ou a une agence. */
const sourcePreset: Preset = {
  id: 'source',
  name: 'Fichiers sources',
  description: 'AI, EPS, PDF et SVG editables, a archiver et a transmettre aux prestataires.',
  category: 'print',
  builtIn: true,
  targets: [
    target({
      id: 'source-ai',
      label: 'Illustrator (.ai)',
      format: 'ai',
      colorProfile: 'cmyk',
      folder: '01-fichiers-sources',
      size: scale(1),
      vector: { preserveEditability: true, outlineText: false, embedImages: true },
    }),
    target({
      id: 'source-ai-outlined',
      label: 'Illustrator vectorise (.ai)',
      format: 'ai',
      colorProfile: 'cmyk',
      folder: '01-fichiers-sources',
      size: scale(1),
      nameTemplate: '{brand}-{asset}-{variant}-vectorise',
      vector: { preserveEditability: true, outlineText: true, embedImages: true },
    }),
    target({
      id: 'source-eps',
      label: 'EPS (compatibilite ascendante)',
      format: 'eps',
      colorProfile: 'cmyk',
      folder: '01-fichiers-sources',
      size: scale(1),
      vector: { outlineText: true, embedImages: true, epsCompatibility: 'illustrator-8' },
    }),
    target({
      id: 'source-pdf',
      label: 'PDF/X-4',
      format: 'pdf',
      colorProfile: 'cmyk',
      folder: '01-fichiers-sources',
      size: scale(1),
      vector: { preserveEditability: true, outlineText: false, pdfPreset: '[PDF/X-4:2008]' },
    }),
    target({
      id: 'source-svg',
      label: 'SVG optimise',
      format: 'svg',
      folder: '01-fichiers-sources',
      size: scale(1),
      vector: { outlineText: true, embedImages: true, svgProfile: 'svg-1.1', svgPrecision: 3 },
    }),
  ],
};

/** 02 — web : vectoriel d abord, raster en secours. */
const webPreset: Preset = {
  id: 'web',
  name: 'Web',
  description: 'SVG, PNG transparents en 1x/2x/3x et WebP pour les sites et applications.',
  category: 'web',
  builtIn: true,
  targets: [
    target({
      id: 'web-svg',
      label: 'SVG',
      format: 'svg',
      folder: '02-web/svg',
      size: scale(1),
      vector: { outlineText: true, embedImages: false, svgProfile: 'svg-1.1', svgPrecision: 2 },
    }),
    target({
      id: 'web-png-500',
      label: 'PNG 500 px',
      format: 'png',
      folder: '02-web/png',
      size: longest(500),
      raster: { dpi: 72, antiAliasing: true },
    }),
    target({
      id: 'web-png-1000',
      label: 'PNG 1000 px',
      format: 'png',
      folder: '02-web/png',
      size: longest(1000),
      raster: { dpi: 72, antiAliasing: true },
    }),
    target({
      id: 'web-png-2000',
      label: 'PNG 2000 px',
      format: 'png',
      folder: '02-web/png',
      size: longest(2000),
      raster: { dpi: 72, antiAliasing: true },
    }),
    target({
      id: 'web-webp-1000',
      label: 'WebP 1000 px',
      format: 'webp',
      folder: '02-web/webp',
      size: longest(1000),
      raster: { dpi: 72, quality: 90, antiAliasing: true },
    }),
  ],
};

/** 03 — impression : CMJN, 300 ppp, aplats prets pour un flux offset. */
const printPreset: Preset = {
  id: 'print',
  name: 'Impression',
  description: 'CMJN 300 ppp : PDF/X-4, EPS et PNG haute definition pour l imprimeur.',
  category: 'print',
  builtIn: true,
  targets: [
    target({
      id: 'print-pdf',
      label: 'PDF/X-4 CMJN',
      format: 'pdf',
      colorProfile: 'cmyk',
      folder: '03-impression',
      size: scale(1),
      vector: { outlineText: true, preserveEditability: false, pdfPreset: '[PDF/X-4:2008]' },
    }),
    target({
      id: 'print-eps',
      label: 'EPS CMJN',
      format: 'eps',
      colorProfile: 'cmyk',
      folder: '03-impression',
      size: scale(1),
      vector: { outlineText: true, embedImages: true, epsCompatibility: 'illustrator-8' },
    }),
    target({
      id: 'print-png-300',
      label: 'PNG 300 ppp',
      format: 'png',
      colorProfile: 'cmyk',
      folder: '03-impression/png-300ppp',
      size: longest(3000),
      raster: { dpi: 300, antiAliasing: true },
    }),
    target({
      id: 'print-tiff-300',
      label: 'TIFF 300 ppp',
      format: 'tiff',
      colorProfile: 'cmyk',
      folder: '03-impression/tiff-300ppp',
      size: longest(3000),
      raster: { dpi: 300, antiAliasing: true },
    }),
  ],
};

/** 04 — reseaux sociaux : un canvas exact par emplacement. */
const socialPreset: Preset = {
  id: 'social',
  name: 'Reseaux sociaux',
  description: 'Un canvas aux dimensions exactes de chaque emplacement, logo centre et marge.',
  category: 'social',
  builtIn: true,
  targets: SOCIAL_SIZES.map((s) =>
    target({
      id: `social-${s.id}`,
      label: `${s.platform} — ${s.label}`,
      format: 'png',
      folder: `04-reseaux-sociaux/${s.platform.toLowerCase()}`,
      size: exact(s.width, s.height),
      nameTemplate: '{brand}-{asset}-{variant}-{size}',
      raster: { dpi: 72, antiAliasing: true },
      ...(s.circular ? { assetRoles: ['icon', 'monogram', 'primary'] } : {}),
    }),
  ),
};

/** 05 — favicons et icones de navigateur, y compris le .ico multi-resolution. */
const faviconPreset: Preset = {
  id: 'favicon',
  name: 'Favicon',
  description: 'Jeu complet de favicons, apple-touch-icon et icones PWA, avec le .ico.',
  category: 'favicon',
  builtIn: true,
  targets: [
    ...FAVICON_SIZES.map((s) =>
      target({
        id: `favicon-${s.size}`,
        label: `${s.label} ${s.size} px`,
        format: 'png',
        folder: '05-favicon',
        size: exact(s.size, s.size),
        nameTemplate: `{asset}-${s.size}x${s.size}`,
        assetRoles: ['icon', 'monogram', 'favicon', 'primary'],
        raster: { dpi: 72, antiAliasing: true },
      }),
    ),
    target({
      id: 'favicon-ico',
      label: 'favicon.ico (16/32/48)',
      format: 'ico',
      folder: '05-favicon',
      size: exact(48, 48),
      nameTemplate: 'favicon',
      assetRoles: ['icon', 'monogram', 'favicon', 'primary'],
      raster: { dpi: 72, antiAliasing: true },
    }),
  ],
};

/** 06 — bureautique : PNG et JPG sur fond blanc, pour Word, PowerPoint, Docs. */
const officePreset: Preset = {
  id: 'office',
  name: 'Bureautique',
  description: 'PNG transparent et JPG sur fond blanc pour Word, PowerPoint et Google Docs.',
  category: 'office',
  builtIn: true,
  targets: [
    target({
      id: 'office-png',
      label: 'PNG 1500 px',
      format: 'png',
      folder: '06-bureautique',
      size: longest(1500),
      raster: { dpi: 150, antiAliasing: true },
    }),
    target({
      id: 'office-jpg',
      label: 'JPG fond blanc',
      format: 'jpg',
      folder: '06-bureautique',
      size: longest(1500),
      raster: { dpi: 150, quality: 92, antiAliasing: true, matte: '#FFFFFF' },
    }),
    target({
      id: 'office-signature',
      label: 'Signature e-mail 300 px',
      format: 'png',
      folder: '06-bureautique/signature-email',
      size: longest(300),
      raster: { dpi: 72, antiAliasing: true },
    }),
  ],
};

/** 07 — icones d application mobile. */
const appPreset: Preset = {
  id: 'app',
  name: 'Icones d application',
  description: 'Jeux d icones iOS et Android aux dimensions exigees par les stores.',
  category: 'app',
  builtIn: true,
  targets: APP_ICON_SIZES.map((s) =>
    target({
      id: `app-${s.id}`,
      label: `${s.label} ${s.size} px`,
      format: 'png',
      folder: '07-icones-application',
      size: exact(s.size, s.size),
      nameTemplate: `{asset}-${s.id}`,
      assetRoles: ['icon', 'monogram', 'primary'],
      raster: { dpi: 72, antiAliasing: true },
    }),
  ),
};

/** 08 — video et diffusion : rendus 4K transparents. */
const videoPreset: Preset = {
  id: 'video',
  name: 'Video',
  description: 'PNG 4K transparents pour le montage, l habillage et les generiques.',
  category: 'video',
  builtIn: true,
  targets: [
    target({
      id: 'video-png-4k',
      label: 'PNG 3840 px',
      format: 'png',
      folder: '08-video',
      size: longest(3840),
      raster: { dpi: 72, antiAliasing: true },
    }),
    target({
      id: 'video-png-1080',
      label: 'PNG 1920 px',
      format: 'png',
      folder: '08-video',
      size: longest(1920),
      raster: { dpi: 72, antiAliasing: true },
    }),
  ],
};

export const BUILTIN_PRESETS: readonly Preset[] = [
  sourcePreset,
  webPreset,
  printPreset,
  socialPreset,
  faviconPreset,
  officePreset,
  appPreset,
  videoPreset,
];

/** Presets actifs par defaut a la premiere ouverture du panneau. */
export const DEFAULT_PRESET_IDS: readonly string[] = [
  'source',
  'web',
  'print',
  'social',
  'favicon',
];

export function getPreset(id: string): Preset | undefined {
  return BUILTIN_PRESETS.find((p) => p.id === id);
}

export function resolvePresetTargets(presetIds: readonly string[]): ExportTarget[] {
  return presetIds.flatMap((id) => getPreset(id)?.targets ?? []);
}
