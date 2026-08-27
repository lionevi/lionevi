import type { BrandInfo, PackagePlan } from '@/types';
import { FORMAT_CAPABILITIES } from '@core/export/formats';

function formatTable(plan: PackagePlan): string {
  const counts = new Map<string, number>();
  for (const file of plan.files) {
    counts.set(file.format, (counts.get(file.format) ?? 0) + 1);
  }
  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([format, count]) => {
      const caps = FORMAT_CAPABILITIES[format as keyof typeof FORMAT_CAPABILITIES];
      const usage = caps.vector
        ? 'Redimensionnable a l infini — impression, grands formats, sources.'
        : 'Taille fixe — ecrans, bureautique, reseaux sociaux.';
      return `| ${caps.label} (.${caps.extension}) | ${count} | ${usage} |`;
    });
  return ['| Format | Fichiers | Usage |', '| --- | --- | --- |', ...rows].join('\n');
}

function colorTable(brand: BrandInfo): string {
  if (brand.colors.length === 0) return '_Aucune couleur de marque renseignee._';
  const rows = brand.colors.map((color) => {
    const cmyk = color.cmyk ? color.cmyk.join(' / ') : '—';
    return `| ${color.name} | ${color.hex.toUpperCase()} | ${cmyk} | ${color.pantone ?? '—'} |`;
  });
  return ['| Couleur | HEX | CMJN | Pantone |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

/** Genere le README livre a la racine du pack. */
export function renderPackageReadme(
  brand: BrandInfo,
  plan: PackagePlan,
  generatedAt = new Date(),
): string {
  const folders = plan.folders.length > 0 ? plan.folders : ['(racine)'];
  return `# Pack logo — ${brand.name}

${brand.tagline ? `_${brand.tagline}_\n` : ''}
Genere le ${generatedAt.toISOString().slice(0, 10)} avec Logo Forge.
Ce dossier contient ${plan.files.length} fichiers repartis dans ${plan.folders.length} sous-dossiers.

## Quel fichier utiliser ?

- **Site web, application** — le SVG en priorite ; le PNG en secours.
- **Impression** — le PDF/X-4 ou l EPS en CMJN, jamais un PNG.
- **Bureautique** — le PNG transparent ; le JPG uniquement si la transparence pose probleme.
- **Reseaux sociaux** — le fichier au nom de la plateforme, deja aux bonnes dimensions.
- **Prestataire externe** — le dossier \`01-fichiers-sources\` dans son integralite.

## Formats livres

${formatTable(plan)}

## Arborescence

\`\`\`
${plan.rootFolder}/
${folders.map((f) => `  ${f}/`).join('\n')}
\`\`\`

## Couleurs de la marque

${colorTable(brand)}

## Regles d usage

- Zone de protection : ${brand.clearSpaceRatio ?? 0.5} fois la hauteur du logo sur les quatre cotes.
- Largeur minimale a l ecran : ${brand.minWidthPx ?? 120} px.
- Ne pas deformer, recolorer, contourner ni ajouter d ombre au logo.
- Sur fond sombre, utiliser la declinaison blanche ; sur fond clair, la declinaison couleur.

${brand.website ? `\n---\n\n${brand.website}` : ''}
`;
}
