import type { ExportFormat } from '@/types';
import { VECTOR_FORMATS } from '@/types';

export interface FormatCapabilities {
  extension: string;
  vector: boolean;
  transparency: boolean;
  cmyk: boolean;
  /** Cote maximal accepte par le format, en pixels. */
  maxPixels?: number;
  /** Le format encode une qualite de compression avec perte. */
  lossy: boolean;
  label: string;
}

export const FORMAT_CAPABILITIES: Record<ExportFormat, FormatCapabilities> = {
  ai: {
    extension: 'ai',
    vector: true,
    transparency: true,
    cmyk: true,
    lossy: false,
    label: 'Adobe Illustrator',
  },
  eps: {
    extension: 'eps',
    vector: true,
    transparency: false,
    cmyk: true,
    lossy: false,
    label: 'EPS',
  },
  pdf: {
    extension: 'pdf',
    vector: true,
    transparency: true,
    cmyk: true,
    lossy: false,
    label: 'PDF',
  },
  svg: {
    extension: 'svg',
    vector: true,
    transparency: true,
    cmyk: false,
    lossy: false,
    label: 'SVG',
  },
  png: {
    extension: 'png',
    vector: false,
    transparency: true,
    cmyk: false,
    lossy: false,
    label: 'PNG',
  },
  jpg: {
    extension: 'jpg',
    vector: false,
    transparency: false,
    cmyk: true,
    lossy: true,
    label: 'JPEG',
  },
  webp: {
    extension: 'webp',
    vector: false,
    transparency: true,
    cmyk: false,
    lossy: true,
    label: 'WebP',
  },
  tiff: {
    extension: 'tif',
    vector: false,
    transparency: true,
    cmyk: true,
    lossy: false,
    label: 'TIFF',
  },
  ico: {
    extension: 'ico',
    vector: false,
    transparency: true,
    cmyk: false,
    maxPixels: 256,
    lossy: false,
    label: 'Icone Windows',
  },
};

export function extensionFor(format: ExportFormat): string {
  return FORMAT_CAPABILITIES[format].extension;
}

export function isVectorFormat(format: ExportFormat): boolean {
  return (VECTOR_FORMATS as readonly string[]).includes(format);
}
