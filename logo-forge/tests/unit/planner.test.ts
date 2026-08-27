import { describe, expect, it } from 'vitest';
import { buildPackagePlan, planStats } from '@core/export/planner';
import { FIXED_DATE, makeAsset, makeSettings } from '../fixtures/settings';

describe('buildPackagePlan', () => {
  it('produit un fichier par combinaison cible x declinaison x plan de travail', () => {
    const settings = makeSettings();
    const activeVariants = settings.variants.filter((v) => v.enabled).length;
    const plan = buildPackagePlan(settings, FIXED_DATE);
    // Le preset « web » compte 5 cibles, applicables a tous les roles.
    expect(plan.files).toHaveLength(5 * activeVariants);
  });

  it('nomme le dossier racine a partir de la marque', () => {
    const plan = buildPackagePlan(makeSettings(), FIXED_DATE);
    expect(plan.rootFolder).toBe('acme-cafe-pack-logo');
  });

  it('signale une selection vide comme une erreur bloquante', () => {
    const plan = buildPackagePlan(makeSettings({ assets: [] }), FIXED_DATE);
    expect(plan.files).toHaveLength(0);
    expect(plan.warnings.some((w) => w.code === 'empty-selection' && w.severity === 'error')).toBe(
      true,
    );
  });

  it('respecte la restriction de role d une cible', () => {
    const settings = makeSettings({
      assets: [makeAsset({ id: 'a', name: 'Logo', role: 'primary' })],
      presetIds: ['app'],
    });
    const withIcon = makeSettings({
      assets: [
        makeAsset({ id: 'a', name: 'Logo', role: 'wordmark' }),
        makeAsset({ id: 'b', name: 'Icone', role: 'icon' }),
      ],
      presetIds: ['app'],
    });
    const rolesInPlan = new Set(
      buildPackagePlan(withIcon, FIXED_DATE).files.map((f) => f.asset.role),
    );
    expect(buildPackagePlan(settings, FIXED_DATE).files.length).toBeGreaterThan(0);
    expect(rolesInPlan.has('wordmark')).toBe(false);
    expect(rolesInPlan.has('icon')).toBe(true);
  });

  it('ne genere jamais deux fois le meme chemin', () => {
    const settings = makeSettings({ presetIds: ['source', 'web', 'print', 'social', 'favicon'] });
    const plan = buildPackagePlan(settings, FIXED_DATE);
    const paths = plan.files.map((f) => f.path.toLowerCase());
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('avertit quand un format ne gere pas le CMJN', () => {
    const settings = makeSettings({ presetIds: ['print'] });
    const plan = buildPackagePlan(settings, FIXED_DATE);
    expect(plan.warnings.some((w) => w.code === 'unsupported-combination')).toBe(true);
  });

  it('change l arborescence selon le mode de regroupement', () => {
    const byUsage = buildPackagePlan(makeSettings(), FIXED_DATE);
    const settings = makeSettings();
    settings.output.groupBy = 'variant';
    const byVariant = buildPackagePlan(settings, FIXED_DATE);
    expect(byUsage.files[0]?.path.startsWith('02-web')).toBe(true);
    expect(byVariant.files[0]?.path.startsWith('couleur/02-web')).toBe(true);
  });

  it('ne calcule une taille en pixels que pour les formats raster', () => {
    const plan = buildPackagePlan(makeSettings(), FIXED_DATE);
    const svg = plan.files.find((f) => f.format === 'svg');
    const png = plan.files.find((f) => f.format === 'png');
    expect(svg?.pixelSize).toBeUndefined();
    expect(png?.pixelSize).toBeDefined();
  });
});

describe('planStats', () => {
  it('compte les fichiers par format', () => {
    const stats = planStats(buildPackagePlan(makeSettings(), FIXED_DATE));
    expect(stats.files).toBeGreaterThan(0);
    expect(stats.byFormat.png).toBeGreaterThan(0);
    expect(stats.errors).toBe(0);
  });
});
