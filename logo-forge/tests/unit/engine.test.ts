import { describe, expect, it, vi } from 'vitest';
import type { FileWriter } from '@core/export/engine';
import { createDryRunWriter, runExport } from '@core/export/engine';
import { buildPackagePlan } from '@core/export/planner';
import { FIXED_DATE, makeSettings } from '../fixtures/settings';

function failingWriter(failOn: string): FileWriter {
  return {
    async writeExport(file) {
      if (file.path.includes(failOn)) throw new Error('Police manquante');
      return 128;
    },
    async writeText() {
      /* les fichiers annexes reussissent toujours ici */
    },
  };
}

describe('runExport', () => {
  it('ecrit chaque fichier planifie et les annexes', async () => {
    const settings = makeSettings();
    const plan = buildPackagePlan(settings, FIXED_DATE);
    const writer = createDryRunWriter();

    const report = await runExport(plan, settings, writer);

    expect(report.counts.done).toBe(plan.files.length);
    expect(report.counts.failed).toBe(0);
    expect(writer.written).toContain('LISEZ-MOI.md');
    expect(writer.written).toContain('charte-utilisation.md');
    expect(writer.written).toContain('rapport-export.md');
  });

  it('poursuit le lot malgre un echec isole', async () => {
    const settings = makeSettings();
    const plan = buildPackagePlan(settings, FIXED_DATE);

    const report = await runExport(plan, settings, failingWriter('.svg'));

    expect(report.counts.failed).toBeGreaterThan(0);
    expect(report.counts.done).toBe(plan.files.length - report.counts.failed);
    expect(report.results.find((r) => r.status === 'failed')?.error).toBe('Police manquante');
  });

  it('ignore les fichiers restants apres une annulation', async () => {
    const settings = makeSettings();
    const plan = buildPackagePlan(settings, FIXED_DATE);
    const signal = { aborted: false };
    const onProgress = vi.fn(() => {
      signal.aborted = true;
    });

    const report = await runExport(plan, settings, createDryRunWriter(), { onProgress, signal });

    expect(report.counts.done).toBe(1);
    expect(report.counts.skipped).toBe(plan.files.length - 1);
  });

  it('emet une progression par fichier', async () => {
    const settings = makeSettings();
    const plan = buildPackagePlan(settings, FIXED_DATE);
    const events: number[] = [];

    await runExport(plan, settings, createDryRunWriter(), {
      onProgress: (event) => {
        if (event.status === 'done') events.push(event.current);
      },
    });

    expect(events).toEqual(plan.files.map((_, index) => index + 1));
  });

  it('n echoue pas quand une annexe ne peut pas etre ecrite', async () => {
    const settings = makeSettings();
    const plan = buildPackagePlan(settings, FIXED_DATE);
    const writer: FileWriter = {
      async writeExport() {
        return 1;
      },
      async writeText() {
        throw new Error('Disque plein');
      },
    };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(runExport(plan, settings, writer)).resolves.toBeDefined();
  });

  it('ecrit les extraits d integration quand le preset favicon est actif', async () => {
    const settings = makeSettings({ presetIds: ['favicon'] });
    const plan = buildPackagePlan(settings, FIXED_DATE);
    const writer = createDryRunWriter();

    await runExport(plan, settings, writer);

    expect(writer.written).toContain('05-favicon/integration.html');
    expect(writer.written).toContain('05-favicon/site.webmanifest');
  });
});
