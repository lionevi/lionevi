import type { LogoAsset } from '@/types';
import { getIllustrator } from './host';
import { inferRole } from './roles';

export interface DocumentInfo {
  name: string;
  artboardCount: number;
  colorSpace: 'rgb' | 'cmyk' | 'unknown';
}

function artboardSize(rect: number[]): { width: number; height: number } {
  const [left = 0, top = 0, right = 0, bottom = 0] = rect;
  return { width: Math.abs(right - left), height: Math.abs(top - bottom) };
}

/** Lit les plans de travail du document actif et les convertit en declinaisons. */
export function readAssets(): LogoAsset[] {
  const ilst = getIllustrator();
  if (!ilst || ilst.app.documents.length === 0) return [];

  const doc = ilst.app.activeDocument;
  const assets: LogoAsset[] = [];
  for (let i = 0; i < doc.artboards.length; i += 1) {
    const artboard = doc.artboards[i];
    if (!artboard) continue;
    const name = artboard.name || `Plan ${i + 1}`;
    const { width, height } = artboardSize(artboard.artboardRect);
    assets.push({
      id: `artboard-${i}`,
      name,
      role: inferRole(name, i),
      artboardIndex: i,
      width,
      height,
      selected: true,
    });
  }
  return assets;
}

export function readDocumentInfo(): DocumentInfo | null {
  const ilst = getIllustrator();
  if (!ilst || ilst.app.documents.length === 0) return null;
  const doc = ilst.app.activeDocument;
  const space = String(doc.documentColorSpace ?? '').toLowerCase();
  return {
    name: doc.name,
    artboardCount: doc.artboards.length,
    colorSpace: space.includes('cmyk') ? 'cmyk' : space.includes('rgb') ? 'rgb' : 'unknown',
  };
}

/**
 * Devine le nom de la marque a partir du nom du document, en retirant
 * l extension et les suffixes de travail les plus courants.
 */
export function guessBrandName(documentName: string): string {
  return (
    documentName
      .replace(/\.(ai|ait|eps|pdf|svg)$/i, '')
      .replace(/[-_ ]*(logo|logos|final|v\d+|copie|copy|master|source)\b/gi, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'Marque'
  );
}
