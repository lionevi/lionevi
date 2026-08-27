import type { ExportReport, JobResult, JobStatus, PackagePlan } from '@/types';

export function emptyCounts(): Record<JobStatus, number> {
  return { pending: 0, running: 0, done: 0, failed: 0, skipped: 0 };
}

export function buildReport(
  plan: PackagePlan,
  results: JobResult[],
  startedAt: Date,
  finishedAt: Date,
): ExportReport {
  const counts = emptyCounts();
  for (const result of results) counts[result.status] += 1;
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    rootFolder: plan.rootFolder,
    results,
    counts,
  };
}

/** Rapport lisible, ecrit a la racine du pack apres chaque export. */
export function renderReportMarkdown(report: ExportReport): string {
  const durationMs = Date.parse(report.finishedAt) - Date.parse(report.startedAt);
  const failures = report.results.filter((r) => r.status === 'failed');
  const failureList =
    failures.length > 0
      ? failures.map((r) => `- \`${r.file.path}\` — ${r.error ?? 'erreur inconnue'}`).join('\n')
      : '_Aucun echec._';

  return `# Rapport d export — ${report.rootFolder}

- Debut : ${report.startedAt}
- Fin : ${report.finishedAt}
- Duree : ${(durationMs / 1000).toFixed(1)} s
- Exportes : ${report.counts.done}
- Ignores : ${report.counts.skipped}
- Echecs : ${report.counts.failed}

## Echecs

${failureList}
`;
}
