import type { ExportFormat, ExportTarget, LogoAsset } from '@/types';
import type { IllustratorModule } from '@/types/illustrator';
import { resolvePixelSize, scalePercent } from '@core/export/size';

/**
 * Traduit une cible Logo Forge en options natives Illustrator.
 *
 * Les objets d options d Illustrator sont des classes instanciables dont on
 * assigne les proprietes une a une : d ou la construction imperative ci-dessous
 * plutot qu un litteral d objet.
 */
export function buildExportOptions(
  ilst: IllustratorModule,
  target: ExportTarget,
  asset: LogoAsset,
): { exportType: unknown; options: Record<string, unknown> } | null {
  const dpi = target.raster?.dpi ?? 72;
  const pixels = resolvePixelSize(target.size, asset, dpi);
  const percent = scalePercent(pixels, asset);

  switch (target.format) {
    case 'png': {
      const options = new ilst.ExportOptionsPNG24();
      options.antiAliasing = target.raster?.antiAliasing ?? true;
      options.transparency = true;
      options.artBoardClipping = true;
      options.horizontalScale = percent;
      options.verticalScale = percent;
      return { exportType: ilst.ExportType.PNG24, options };
    }
    case 'jpg': {
      const options = new ilst.ExportOptionsJPEG();
      options.antiAliasing = target.raster?.antiAliasing ?? true;
      options.qualitySetting = target.raster?.quality ?? 90;
      options.artBoardClipping = true;
      options.horizontalScale = percent;
      options.verticalScale = percent;
      return { exportType: ilst.ExportType.JPEG, options };
    }
    case 'webp': {
      if (!ilst.ExportOptionsWebP) return null;
      const options = new ilst.ExportOptionsWebP();
      options.quality = target.raster?.quality ?? 90;
      options.artBoardClipping = true;
      options.horizontalScale = percent;
      options.verticalScale = percent;
      return { exportType: ilst.ExportType.WEBP, options };
    }
    case 'tiff': {
      if (!ilst.ExportOptionsTIFF) return null;
      const options = new ilst.ExportOptionsTIFF();
      options.resolution = dpi;
      options.antiAliasing = target.raster?.antiAliasing ?? true;
      options.artBoardClipping = true;
      return { exportType: ilst.ExportType.TIFF, options };
    }
    case 'svg': {
      const options: Record<string, unknown> = {
        coordinatePrecision: target.vector?.svgPrecision ?? 3,
        embedRasterImages: target.vector?.embedImages ?? false,
        fontType: target.vector?.outlineText ? 'outline' : 'svg',
        documentEncoding: 'utf8',
      };
      return { exportType: ilst.ExportType.SVG, options };
    }
    case 'pdf': {
      const options = new ilst.PDFSaveOptions();
      options.preserveEditability = target.vector?.preserveEditability ?? true;
      if (target.vector?.pdfPreset) options.pDFPreset = target.vector.pdfPreset;
      return { exportType: null, options };
    }
    case 'eps': {
      const options = new ilst.EPSSaveOptions();
      options.embedAllFonts = true;
      options.includeDocumentThumbnails = true;
      options.embedLinkedFiles = target.vector?.embedImages ?? true;
      return { exportType: null, options };
    }
    case 'ai': {
      const options = new ilst.IllustratorSaveOptions();
      options.pdfCompatible = true;
      options.embedLinkedFiles = target.vector?.embedImages ?? true;
      return { exportType: null, options };
    }
    case 'ico':
      // Illustrator n exporte pas le .ico : il est assemble a partir des PNG.
      return null;
  }
}

/** Les formats produits par `saveAs` plutot que par `exportFile`. */
export const SAVE_AS_FORMATS: readonly ExportFormat[] = ['ai', 'pdf', 'eps'];

export function usesSaveAs(format: ExportFormat): boolean {
  return SAVE_AS_FORMATS.includes(format);
}
