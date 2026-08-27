import { useCallback, useState } from 'react';
import type { ExportReport, ProgressEvent } from '@/types';
import { createDryRunWriter, runExport } from '@core/export/engine';
import { useApp } from '@ui/state/store';

export interface DryRun {
  run: () => Promise<void>;
  report: ExportReport | null;
  progress: ProgressEvent | null;
  busy: boolean;
}

/**
 * Simulation complete du pack : le moteur, le nommage et les fichiers annexes
 * sont executes reellement, seule l ecriture est court-circuitee. C est ce qui
 * permet de valider un pack de 300 fichiers avant de lancer Illustrator.
 */
export function useDryRun(): DryRun {
  const { state, plan } = useApp();
  const [report, setReport] = useState<ExportReport | null>(null);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setReport(null);
    try {
      const writer = createDryRunWriter();
      setReport(await runExport(plan, state.settings, writer, { onProgress: setProgress }));
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }, [plan, state.settings]);

  return { run, report, progress, busy };
}
