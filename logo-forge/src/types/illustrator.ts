/**
 * Sous-ensemble type de l API UXP d Illustrator effectivement utilise par
 * Logo Forge. Adobe ne publie pas encore de typings officiels complets pour
 * `require('illustrator')` : on declare ici uniquement ce que l on appelle,
 * afin que le compilateur signale toute derive.
 */

export interface IllustratorPoint {
  0: number;
  1: number;
  2: number;
  3: number;
}

export interface Artboard {
  name: string;
  /** [gauche, haut, droite, bas] en points. */
  artboardRect: number[];
}

export interface Artboards {
  readonly length: number;
  getByName(name: string): Artboard;
  [index: number]: Artboard;
  setActiveArtboardIndex(index: number): void;
}

export interface IllustratorDocument {
  name: string;
  artboards: Artboards;
  documentColorSpace: unknown;
  layers: { readonly length: number; [index: number]: { name: string; visible: boolean } };
  exportFile(file: unknown, exportType: unknown, options?: unknown): void;
  saveAs(file: unknown, options?: unknown): void;
  close(saveOptions?: unknown): void;
  duplicate?(): IllustratorDocument;
}

export interface IllustratorApp {
  readonly documents: { readonly length: number; [index: number]: IllustratorDocument };
  activeDocument: IllustratorDocument;
  userInteractionLevel: unknown;
  version: string;
}

export interface IllustratorModule {
  app: IllustratorApp;
  ExportType: Record<string, unknown>;
  ExportOptionsPNG24: new () => Record<string, unknown>;
  ExportOptionsJPEG: new () => Record<string, unknown>;
  ExportOptionsWebP?: new () => Record<string, unknown>;
  ExportOptionsTIFF?: new () => Record<string, unknown>;
  ExportForScreensItemToExport?: new () => Record<string, unknown>;
  PDFSaveOptions: new () => Record<string, unknown>;
  EPSSaveOptions: new () => Record<string, unknown>;
  IllustratorSaveOptions: new () => Record<string, unknown>;
  DocumentColorSpace: Record<string, unknown>;
  UserInteractionLevel: Record<string, unknown>;
}
