import type { BrandInfo, ExportSettings, NamingScheme, OutputSettings } from '@/types';
import { DEFAULT_PRESET_IDS } from '@core/presets';
import { cloneDefaultVariants } from '@core/variants';

export const DEFAULT_NAMING: NamingScheme = {
  template: '{brand}-{asset}-{variant}',
  case: 'kebab',
  asciiOnly: true,
  maxLength: 80,
};

export const DEFAULT_OUTPUT: OutputSettings = {
  rootFolderTemplate: '{brand}-pack-logo',
  groupBy: 'usage',
  createZip: false,
  includeReadme: true,
  includeGuidelines: true,
  overwrite: 'suffix',
};

export const DEFAULT_BRAND: BrandInfo = {
  name: 'Marque',
  colors: [],
  fonts: [],
  clearSpaceRatio: 0.5,
  minWidthPx: 120,
};

export function createDefaultSettings(overrides: Partial<ExportSettings> = {}): ExportSettings {
  return {
    brand: { ...DEFAULT_BRAND },
    assets: [],
    variants: cloneDefaultVariants(),
    presetIds: [...DEFAULT_PRESET_IDS],
    customTargets: [],
    naming: { ...DEFAULT_NAMING },
    output: { ...DEFAULT_OUTPUT },
    ...overrides,
  };
}

/** Cle de persistance dans le stockage local du plugin. */
export const SETTINGS_STORAGE_KEY = 'logo-forge.settings.v1';
