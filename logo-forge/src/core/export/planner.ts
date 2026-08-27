import type {
  ColorVariant,
  ExportSettings,
  ExportTarget,
  LogoAsset,
  PackagePlan,
  PlanWarning,
  PlannedFile,
} from '@/types';
import { renderName, sanitizeSegment, uniquePath } from '@core/naming';
import { resolvePresetTargets } from '@core/presets';
import { contrastRatio, MIN_GRAPHIC_CONTRAST } from '@core/variants/contrast';
import { extensionFor, FORMAT_CAPABILITIES, isVectorFormat } from './formats';
import { resolvePixelSize } from './size';

function appliesToAsset(targetSpec: ExportTarget, asset: LogoAsset): boolean {
  const roles = targetSpec.assetRoles;
  return !roles || roles.length === 0 || roles.includes(asset.role);
}

function appliesToVariant(targetSpec: ExportTarget, variant: ColorVariant): boolean {
  const kinds = targetSpec.variantKinds;
  return !kinds || kinds.length === 0 || kinds.includes(variant.kind);
}

function folderFor(
  settings: ExportSettings,
  targetSpec: ExportTarget,
  asset: LogoAsset,
  variant: ColorVariant,
): string {
  const slug = (value: string) => sanitizeSegment(value, settings.naming);
  const base = targetSpec.folder
    .split('/')
    .map((segment) => sanitizeSegment(segment, { ...settings.naming, case: 'kebab' }))
    .filter(Boolean)
    .join('/');

  switch (settings.output.groupBy) {
    case 'usage':
      return [base, slug(variant.label)].filter(Boolean).join('/');
    case 'format':
      return [slug(FORMAT_CAPABILITIES[targetSpec.format].label), slug(variant.label)]
        .filter(Boolean)
        .join('/');
    case 'variant':
      return [slug(variant.label), base].filter(Boolean).join('/');
    case 'asset':
      return [slug(asset.name), base].filter(Boolean).join('/');
  }
}

function checkCombination(
  targetSpec: ExportTarget,
  variant: ColorVariant,
  fileId: string,
): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const caps = FORMAT_CAPABILITIES[targetSpec.format];

  if (targetSpec.colorProfile === 'cmyk' && !caps.cmyk) {
    warnings.push({
      code: 'unsupported-combination',
      severity: 'warning',
      ref: fileId,
      message: `${caps.label} ne gere pas le CMJN : l export bascule en RVB.`,
    });
  }

  if (variant.background === null && !caps.transparency) {
    warnings.push({
      code: 'unsupported-combination',
      severity: 'info',
      ref: fileId,
      message: `${caps.label} n a pas de canal alpha : un fond ${
        targetSpec.raster?.matte ?? '#FFFFFF'
      } est applique.`,
    });
  }

  if (variant.color && variant.background) {
    const ratio = contrastRatio(variant.color, variant.background);
    if (ratio !== null && ratio < MIN_GRAPHIC_CONTRAST) {
      warnings.push({
        code: 'unsupported-combination',
        severity: 'warning',
        ref: fileId,
        message: `Contraste insuffisant pour « ${variant.label} » (${ratio.toFixed(
          1,
        )}:1, minimum ${MIN_GRAPHIC_CONTRAST}:1).`,
      });
    }
  }

  if (caps.maxPixels) {
    const longest = Math.max(
      targetSpec.size.value,
      targetSpec.size.height ?? targetSpec.size.value,
    );
    if (targetSpec.size.mode !== 'scale' && longest > caps.maxPixels) {
      warnings.push({
        code: 'unsupported-combination',
        severity: 'warning',
        ref: fileId,
        message: `${caps.label} est limite a ${caps.maxPixels} px de cote.`,
      });
    }
  }

  return warnings;
}

/**
 * Construit le plan complet du pack : la liste exacte des fichiers, leurs
 * chemins et les avertissements.
 *
 * Le plan est calcule sans toucher au document, ce qui permet de l afficher en
 * previsualisation, de le tester et de le rejouer a l identique.
 */
export function buildPackagePlan(settings: ExportSettings, now = new Date()): PackagePlan {
  const warnings: PlanWarning[] = [];
  const files: PlannedFile[] = [];
  const taken = new Set<string>();

  const assets = settings.assets.filter((a) => a.selected);
  const variants = settings.variants.filter((v) => v.enabled);
  const targets = [...resolvePresetTargets(settings.presetIds), ...settings.customTargets].filter(
    (t) => t.enabled,
  );

  if (assets.length === 0) {
    warnings.push({
      code: 'empty-selection',
      severity: 'error',
      message: 'Aucun plan de travail selectionne : rien a exporter.',
    });
  }
  if (variants.length === 0) {
    warnings.push({
      code: 'empty-selection',
      severity: 'error',
      message: 'Aucune declinaison de couleur activee.',
    });
  }
  if (targets.length === 0) {
    warnings.push({
      code: 'empty-selection',
      severity: 'error',
      message: 'Aucun preset ni format actif.',
    });
  }

  let index = 0;
  for (const targetSpec of targets) {
    for (const asset of assets) {
      if (!appliesToAsset(targetSpec, asset)) continue;
      for (const variant of variants) {
        if (!appliesToVariant(targetSpec, variant)) continue;

        const dpi = targetSpec.raster?.dpi ?? 72;
        const pixelSize = isVectorFormat(targetSpec.format)
          ? undefined
          : resolvePixelSize(targetSpec.size, asset, dpi);

        const rendered = renderName(
          targetSpec.nameTemplate ?? settings.naming.template,
          { brand: settings.brand.name, asset, variant, target: targetSpec, pixelSize, index, now },
          settings.naming,
        );

        const folder = folderFor(settings, targetSpec, asset, variant);
        const fileName = `${rendered.name}.${extensionFor(targetSpec.format)}`;
        const path = uniquePath(taken, folder ? `${folder}/${fileName}` : fileName);
        const id = `${targetSpec.id}:${asset.id}:${variant.id}`;

        if (path !== (folder ? `${folder}/${fileName}` : fileName)) {
          warnings.push({
            code: 'name-collision',
            severity: 'info',
            ref: id,
            message: `Nom deja pris, le fichier devient « ${path} ».`,
          });
        }

        warnings.push(...rendered.warnings.map((w) => ({ ...w, ref: id })));
        warnings.push(...checkCombination(targetSpec, variant, id));

        files.push({
          id,
          path,
          asset,
          variant,
          target: targetSpec,
          format: targetSpec.format,
          ...(pixelSize ? { pixelSize } : {}),
        });
        index += 1;
      }
    }
  }

  const rootFolder = sanitizeSegment(
    settings.output.rootFolderTemplate.replace(/\{brand\}/gi, settings.brand.name),
    { ...settings.naming, case: 'kebab' },
  );

  const folders = [...new Set(files.map((f) => f.path.split('/').slice(0, -1).join('/')))]
    .filter(Boolean)
    .sort();

  return { rootFolder: rootFolder || 'logo-package', folders, files, warnings: dedupe(warnings) };
}

/** Un meme avertissement de gabarit se repete sur chaque fichier : on l affiche une fois. */
function dedupe(warnings: PlanWarning[]): PlanWarning[] {
  const seen = new Set<string>();
  return warnings.filter((w) => {
    const key = `${w.code}|${w.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface PlanStats {
  files: number;
  folders: number;
  byFormat: Record<string, number>;
  errors: number;
  warnings: number;
}

export function planStats(plan: PackagePlan): PlanStats {
  const byFormat: Record<string, number> = {};
  for (const file of plan.files) {
    byFormat[file.format] = (byFormat[file.format] ?? 0) + 1;
  }
  return {
    files: plan.files.length,
    folders: plan.folders.length,
    byFormat,
    errors: plan.warnings.filter((w) => w.severity === 'error').length,
    warnings: plan.warnings.filter((w) => w.severity === 'warning').length,
  };
}
