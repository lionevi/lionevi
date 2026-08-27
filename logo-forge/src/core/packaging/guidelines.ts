import type { BrandInfo, ColorVariant } from '@/types';

/**
 * Mini-charte livree avec le pack. Elle est generee en Markdown : le rendu PDF
 * est produit ensuite par Illustrator, mais le Markdown reste lisible tel quel
 * et versionnable par le client.
 */
export function renderGuidelines(brand: BrandInfo, variants: readonly ColorVariant[]): string {
  const active = variants.filter((v) => v.enabled);
  const variantList = active.map((v) => `- **${v.label}** — ${describeVariant(v)}`).join('\n');

  const fonts =
    brand.fonts.length > 0
      ? brand.fonts
          .map(
            (f) => `- **${f.family}** — ${f.usage} (${f.weights.join(', ') || 'toutes graisses'})`,
          )
          .join('\n')
      : '_Aucune police renseignee._';

  return `# Charte d utilisation — ${brand.name}

## Declinaisons

${variantList || '_Aucune declinaison activee._'}

## Zone de protection

Reserver autour du logo une marge egale a **${brand.clearSpaceRatio ?? 0.5} fois sa hauteur**.
Aucun texte, image ou bord de page ne doit y penetrer.

## Taille minimale

- Ecran : **${brand.minWidthPx ?? 120} px** de large.
- Impression : **25 mm** de large.

En dessous de ces seuils, utiliser la declinaison icone ou monogramme.

## Interdits

1. Ne pas deformer les proportions.
2. Ne pas modifier les couleurs hors des declinaisons fournies.
3. Ne pas ajouter d ombre portee, de contour ni d effet.
4. Ne pas reconstituer le logo avec une autre police.
5. Ne pas placer le logo couleur sur un fond a contraste insuffisant.

## Typographie

${fonts}

## Contacts

${brand.contact ?? '_Non renseigne._'}
`;
}

function describeVariant(variant: ColorVariant): string {
  switch (variant.kind) {
    case 'primary':
      return 'version de reference, a privilegier sur fond clair et uni.';
    case 'monochrome-black':
      return 'usage monochrome : fax, gravure, tampon, impression une couleur.';
    case 'monochrome-white':
      return 'reservee aux fonds sombres ou aux photographies contrastees.';
    case 'grayscale':
      return 'documents imprimes en niveaux de gris.';
    case 'inverted':
      return 'version couleur posee sur un fond sombre fourni.';
    case 'custom':
      return 'declinaison personnalisee definie pour un usage specifique.';
  }
}
