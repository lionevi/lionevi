import type { ExportSettings, LogoAsset } from '@/types';
import { createDefaultSettings } from '@core/defaults';

export function makeAsset(overrides: Partial<LogoAsset> = {}): LogoAsset {
  return {
    id: 'artboard-0',
    name: 'Logo principal',
    role: 'primary',
    artboardIndex: 0,
    width: 400,
    height: 200,
    selected: true,
    ...overrides,
  };
}

export function makeSettings(overrides: Partial<ExportSettings> = {}): ExportSettings {
  const base = createDefaultSettings({
    assets: [makeAsset()],
    presetIds: ['web'],
    ...overrides,
  });
  base.brand.name = overrides.brand?.name ?? 'Acme Café';
  return base;
}

export const FIXED_DATE = new Date('2026-01-15T10:00:00.000Z');
