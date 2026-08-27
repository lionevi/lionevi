/**
 * Modele de domaine de Logo Forge.
 *
 * Tout le pipeline d'export est decrit par des donnees pures (aucune dependance
 * a l'API Illustrator) : c'est ce qui permet de planifier, previsualiser et
 * tester un pack complet sans jamais ouvrir un document.
 */

export type RasterFormat = 'png' | 'jpg' | 'webp' | 'tiff' | 'ico';
export type VectorFormat = 'svg' | 'pdf' | 'eps' | 'ai';
export type ExportFormat = RasterFormat | VectorFormat;

export const RASTER_FORMATS: readonly RasterFormat[] = ['png', 'jpg', 'webp', 'tiff', 'ico'];
export const VECTOR_FORMATS: readonly VectorFormat[] = ['svg', 'pdf', 'eps', 'ai'];

export type ColorProfile = 'rgb' | 'cmyk' | 'grayscale';

/** Unite de mesure acceptee pour une taille d'export. */
export type SizeUnit = 'px' | 'mm' | 'in' | 'pt';

export type SizeMode =
  /** Multiplie la taille du plan de travail (1 = 100 %). */
  | 'scale'
  /** Contraint la largeur, la hauteur suit le ratio. */
  | 'width'
  /** Contraint la hauteur, la largeur suit le ratio. */
  | 'height'
  /** Contraint le plus grand cote, utile pour des logos horizontaux et verticaux melanges. */
  | 'longest-edge'
  /** Largeur ET hauteur imposees (canvas fixe, logo centre) — reseaux sociaux, favicons. */
  | 'exact';

export interface SizeSpec {
  mode: SizeMode;
  value: number;
  /** Uniquement pour `mode: 'exact'`. */
  height?: number;
  unit: SizeUnit;
}

export interface RasterOptions {
  dpi: number;
  /** 0-100, applicable a jpg et webp. */
  quality: number;
  antiAliasing: boolean;
  interlaced: boolean;
  /** Couleur de fond quand la transparence n'est pas supportee (jpg). */
  matte: string;
}

export interface VectorOptions {
  outlineText: boolean;
  embedImages: boolean;
  /** Conserve les calques et l'editabilite (ai, pdf). */
  preserveEditability: boolean;
  /** Nom du preset PDF Illustrator, ex. « [PDF/X-4:2008] ». */
  pdfPreset?: string;
  /** Profil SVG : `svg-1.1` reste le plus compatible, `svg-tiny` cible l'embarque. */
  svgProfile?: 'svg-1.1' | 'svg-tiny' | 'svg-basic';
  /** Nombre de decimales des coordonnees SVG (poids du fichier). */
  svgPrecision?: number;
  /** Version EPS de compatibilite. */
  epsCompatibility?: 'illustrator-8' | 'illustrator-cc';
}

export type VariantKind =
  'primary' | 'monochrome-black' | 'monochrome-white' | 'grayscale' | 'inverted' | 'custom';

export interface ColorVariant {
  id: string;
  label: string;
  kind: VariantKind;
  /** Couleur de substitution (#RRGGBB) pour les variantes monochromes et personnalisees. */
  color?: string;
  /** Fond applique aux exports raster ; `null` signifie transparent. */
  background: string | null;
  enabled: boolean;
}

export type LogoRole =
  | 'primary'
  | 'horizontal'
  | 'stacked'
  | 'icon'
  | 'wordmark'
  | 'monogram'
  | 'lockup'
  | 'favicon'
  | 'other';

/** Un plan de travail Illustrator identifie comme une declinaison du logo. */
export interface LogoAsset {
  id: string;
  name: string;
  role: LogoRole;
  artboardIndex: number;
  /** Dimensions du plan de travail en points. */
  width: number;
  height: number;
  selected: boolean;
}

export interface ExportTarget {
  id: string;
  label: string;
  format: ExportFormat;
  colorProfile: ColorProfile;
  size: SizeSpec;
  /** Chemin relatif dans le pack, en segments POSIX (ex. « web/png »). */
  folder: string;
  raster?: Partial<RasterOptions>;
  vector?: Partial<VectorOptions>;
  /** Limite la cible a certains roles ; vide ou absent = tous les roles. */
  assetRoles?: LogoRole[];
  /** Limite la cible a certaines variantes ; vide ou absent = toutes. */
  variantKinds?: VariantKind[];
  /** Surcharge le gabarit de nommage global pour cette cible. */
  nameTemplate?: string;
  enabled: boolean;
}

export type PresetCategory =
  'web' | 'print' | 'social' | 'office' | 'app' | 'favicon' | 'video' | 'custom';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  builtIn: boolean;
  targets: ExportTarget[];
}

export type NameCase = 'kebab' | 'snake' | 'camel' | 'pascal' | 'original';

export interface NamingScheme {
  /** Gabarit a tokens, ex. « {brand}-{asset}-{variant}-{size} ». */
  template: string;
  case: NameCase;
  /** Translitere les accents et supprime les caracteres hors ASCII. */
  asciiOnly: boolean;
  /** Longueur maximale du nom de fichier, extension exclue. */
  maxLength: number;
}

export interface BrandColor {
  name: string;
  hex: string;
  cmyk?: [number, number, number, number];
  pantone?: string;
}

export interface BrandFont {
  family: string;
  usage: string;
  weights: string[];
}

export interface BrandInfo {
  name: string;
  tagline?: string;
  website?: string;
  contact?: string;
  colors: BrandColor[];
  fonts: BrandFont[];
  /** Zone de protection exprimee en multiples de la hauteur du logo. */
  clearSpaceRatio?: number;
  /** Largeur minimale d'usage, en pixels. */
  minWidthPx?: number;
}

export type GroupBy = 'format' | 'variant' | 'asset' | 'usage';
export type OverwritePolicy = 'skip' | 'overwrite' | 'suffix';

export interface OutputSettings {
  /** Gabarit du dossier racine du pack, ex. « {brand}-logo-package ». */
  rootFolderTemplate: string;
  groupBy: GroupBy;
  createZip: boolean;
  includeReadme: boolean;
  includeGuidelines: boolean;
  overwrite: OverwritePolicy;
}

export interface ExportSettings {
  brand: BrandInfo;
  assets: LogoAsset[];
  variants: ColorVariant[];
  /** Identifiants des presets actifs. */
  presetIds: string[];
  /** Cibles ajoutees a la main, en plus des presets. */
  customTargets: ExportTarget[];
  naming: NamingScheme;
  output: OutputSettings;
}

export interface PlannedFile {
  id: string;
  /** Chemin relatif POSIX depuis la racine du pack, extension incluse. */
  path: string;
  asset: LogoAsset;
  variant: ColorVariant;
  target: ExportTarget;
  format: ExportFormat;
  /** Dimensions resolues en pixels pour les formats raster. */
  pixelSize?: { width: number; height: number };
}

export type WarningCode =
  | 'name-collision'
  | 'unknown-token'
  | 'empty-selection'
  | 'unsupported-combination'
  | 'upscaled-raster'
  | 'ignored-target';

export interface PlanWarning {
  code: WarningCode;
  message: string;
  severity: 'info' | 'warning' | 'error';
  /** Identifiant du fichier ou de la cible concernee. */
  ref?: string;
}

export interface PackagePlan {
  rootFolder: string;
  folders: string[];
  files: PlannedFile[];
  warnings: PlanWarning[];
}

export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface JobResult {
  file: PlannedFile;
  status: JobStatus;
  error?: string;
  durationMs: number;
  bytes?: number;
}

export interface ExportReport {
  startedAt: string;
  finishedAt: string;
  rootFolder: string;
  results: JobResult[];
  counts: Record<JobStatus, number>;
}

export interface ProgressEvent {
  current: number;
  total: number;
  file: PlannedFile;
  status: JobStatus;
}
