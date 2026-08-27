import type {
  ExportReport,
  ExportSettings,
  JobResult,
  PackagePlan,
  PlannedFile,
  ProgressEvent,
} from '@/types';
import { renderGuidelines, renderPackageReadme, renderWebManifest } from '@core/packaging';
import { renderFaviconHtml } from '@core/packaging/snippets';
import { buildReport, renderReportMarkdown } from '@core/report';

/**
 * Contrat d ecriture du moteur.
 *
 * L injecter plutot que d appeler Illustrator directement rend tout le
 * sequencement testable, et permet la previsualisation « a blanc » qui liste le
 * pack complet sans ecrire un seul octet.
 */
export interface FileWriter {
  /** Ecrit un fichier planifie et retourne sa taille en octets. */
  writeExport(file: PlannedFile): Promise<number>;
  /** Ecrit un fichier texte annexe (README, charte, rapport, extraits). */
  writeText(relativePath: string, contents: string): Promise<void>;
}

export interface RunOptions {
  onProgress?: (event: ProgressEvent) => void;
  /** Interrompt l export a la fin du fichier en cours. */
  signal?: { aborted: boolean };
  /** Injectable pour les tests. */
  now?: () => Date;
}

/**
 * Execute un plan d export.
 *
 * L echec d un fichier n interrompt jamais le lot : il est consigne et l export
 * continue. Un pack de 300 fichiers ne doit pas etre perdu parce qu une police
 * manque sur une seule declinaison.
 */
export async function runExport(
  plan: PackagePlan,
  settings: ExportSettings,
  writer: FileWriter,
  options: RunOptions = {},
): Promise<ExportReport> {
  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const results: JobResult[] = [];

  for (const [index, file] of plan.files.entries()) {
    if (options.signal?.aborted) {
      results.push({ file, status: 'skipped', durationMs: 0, error: 'Export annule.' });
      continue;
    }

    options.onProgress?.({ current: index + 1, total: plan.files.length, file, status: 'running' });
    const start = now().getTime();
    try {
      const bytes = await writer.writeExport(file);
      results.push({ file, status: 'done', durationMs: now().getTime() - start, bytes });
      options.onProgress?.({ current: index + 1, total: plan.files.length, file, status: 'done' });
    } catch (error) {
      results.push({
        file,
        status: 'failed',
        durationMs: now().getTime() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      options.onProgress?.({
        current: index + 1,
        total: plan.files.length,
        file,
        status: 'failed',
      });
    }
  }

  await writeSidecarFiles(plan, settings, writer, now());

  const report = buildReport(plan, results, startedAt, now());
  await safeWrite(writer, 'rapport-export.md', renderReportMarkdown(report));
  return report;
}

async function writeSidecarFiles(
  plan: PackagePlan,
  settings: ExportSettings,
  writer: FileWriter,
  generatedAt: Date,
): Promise<void> {
  if (settings.output.includeReadme) {
    await safeWrite(writer, 'LISEZ-MOI.md', renderPackageReadme(settings.brand, plan, generatedAt));
  }
  if (settings.output.includeGuidelines) {
    await safeWrite(
      writer,
      'charte-utilisation.md',
      renderGuidelines(settings.brand, settings.variants),
    );
  }
  if (plan.files.some((f) => f.target.folder.includes('favicon'))) {
    await safeWrite(writer, '05-favicon/integration.html', renderFaviconHtml(settings.brand));
    await safeWrite(writer, '05-favicon/site.webmanifest', renderWebManifest(settings.brand));
  }
}

/** Les fichiers annexes ne doivent jamais faire echouer un export reussi. */
async function safeWrite(writer: FileWriter, path: string, contents: string): Promise<void> {
  try {
    await writer.writeText(path, contents);
  } catch (error) {
    console.warn(`Logo Forge : ecriture de « ${path} » impossible.`, error);
  }
}

export interface DryRunWriter extends FileWriter {
  readonly written: string[];
}

/** Simule un export complet : utilise par la previsualisation et par les tests. */
export function createDryRunWriter(): DryRunWriter {
  const written: string[] = [];
  return {
    written,
    async writeExport(file) {
      written.push(file.path);
      return 0;
    },
    async writeText(relativePath) {
      written.push(relativePath);
    },
  };
}
