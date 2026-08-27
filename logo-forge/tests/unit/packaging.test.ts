import { describe, expect, it } from 'vitest';
import type { BrandInfo } from '@/types';
import { buildPackagePlan } from '@core/export/planner';
import { renderGuidelines, renderPackageReadme } from '@core/packaging';
import { renderCssVariables, renderFaviconHtml, renderWebManifest } from '@core/packaging/snippets';
import { cloneDefaultVariants } from '@core/variants';
import { FIXED_DATE, makeSettings } from '../fixtures/settings';

const brand: BrandInfo = {
  name: 'Acme',
  tagline: 'Le café qui réveille',
  website: 'https://acme.example',
  colors: [
    { name: 'Rouge Acme', hex: '#e34850', cmyk: [0, 80, 70, 0], pantone: '186 C' },
    { name: 'Noir profond', hex: '#111111' },
  ],
  fonts: [{ family: 'Inter', usage: 'Titres', weights: ['600', '700'] }],
  clearSpaceRatio: 0.5,
  minWidthPx: 120,
};

describe('renderPackageReadme', () => {
  const plan = buildPackagePlan(makeSettings(), FIXED_DATE);
  const readme = renderPackageReadme(brand, plan, FIXED_DATE);

  it('annonce le nombre exact de fichiers', () => {
    expect(readme).toContain(`${plan.files.length} fichiers`);
  });

  it('documente chaque format present dans le pack', () => {
    expect(readme).toContain('SVG (.svg)');
    expect(readme).toContain('PNG (.png)');
  });

  it('restitue les couleurs de la marque', () => {
    expect(readme).toContain('#E34850');
    expect(readme).toContain('186 C');
  });
});

describe('renderGuidelines', () => {
  it('ne liste que les declinaisons activees', () => {
    const variants = cloneDefaultVariants();
    const guidelines = renderGuidelines(brand, variants);
    expect(guidelines).toContain('**Couleur**');
    expect(guidelines).not.toContain('**Nuances de gris**');
  });

  it('reprend la zone de protection et la taille minimale', () => {
    const guidelines = renderGuidelines(brand, cloneDefaultVariants());
    expect(guidelines).toContain('0.5 fois sa hauteur');
    expect(guidelines).toContain('120 px');
  });
});

describe('extraits d integration', () => {
  it('genere des balises favicon coherentes avec les tailles exportees', () => {
    const html = renderFaviconHtml(brand);
    expect(html).toContain('sizes="32x32" href="/favicon-32x32.png"');
    expect(html).toContain('apple-touch-icon');
  });

  it('produit un webmanifest valide', () => {
    const manifest = JSON.parse(renderWebManifest(brand));
    expect(manifest.name).toBe('Acme');
    expect(manifest.theme_color).toBe('#e34850');
    expect(manifest.icons).toHaveLength(2);
  });

  it('convertit les couleurs en variables CSS', () => {
    expect(renderCssVariables(brand)).toContain('--rouge-acme: #E34850;');
  });

  it('reste valide sans couleur renseignee', () => {
    expect(renderCssVariables({ ...brand, colors: [] })).toBe(':root {\n}\n');
  });
});
