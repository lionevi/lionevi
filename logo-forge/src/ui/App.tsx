import { useState } from 'react';
import { t } from '@/i18n';
import { ProgressBar } from '@ui/components/ProgressBar';
import { Tabs, type TabDefinition } from '@ui/components/Tabs';
import { AssetsPanel } from '@ui/panels/AssetsPanel';
import { NamingPanel } from '@ui/panels/NamingPanel';
import { OutputPanel } from '@ui/panels/OutputPanel';
import { PlanSummary } from '@ui/panels/PlanSummary';
import { PresetsPanel } from '@ui/panels/PresetsPanel';
import { VariantsPanel } from '@ui/panels/VariantsPanel';
import { useDocument } from '@ui/hooks/useDocument';
import { useDryRun } from '@ui/hooks/useDryRun';
import { useApp } from '@ui/state/store';

type TabId = 'assets' | 'variants' | 'presets' | 'naming' | 'output';

const TABS: readonly TabDefinition<TabId>[] = [
  { id: 'assets', label: t('tab.assets') },
  { id: 'variants', label: t('tab.variants') },
  { id: 'presets', label: t('tab.presets') },
  { id: 'naming', label: t('tab.naming') },
  { id: 'output', label: t('tab.output') },
];

export function App(): JSX.Element {
  const [tab, setTab] = useState<TabId>('assets');
  const { state } = useApp();
  const { refresh, available } = useDocument();
  const dryRun = useDryRun();

  return (
    <div className="lf-app">
      <header className="lf-header">
        <div>
          <h1 className="lf-header__title">{t('app.title')}</h1>
          <p className="lf-header__subtitle">{t('app.subtitle')}</p>
        </div>
        <button type="button" className="lf-link" onClick={refresh}>
          {state.documentName ?? t('doc.none')}
        </button>
      </header>

      <Tabs tabs={TABS} active={tab} onSelect={setTab} />

      <main className="lf-main">
        {tab === 'assets' ? <AssetsPanel /> : null}
        {tab === 'variants' ? <VariantsPanel /> : null}
        {tab === 'presets' ? <PresetsPanel /> : null}
        {tab === 'naming' ? <NamingPanel /> : null}
        {tab === 'output' ? <OutputPanel /> : null}
      </main>

      <footer className="lf-footer">
        <PlanSummary />
        {!available ? (
          <p className="lf-note">
            Illustrator n est pas detecte : le panneau fonctionne en previsualisation seule.
          </p>
        ) : null}
        <button
          type="button"
          className="lf-button"
          disabled={dryRun.busy}
          onClick={() => void dryRun.run()}
        >
          {t('plan.preview')}
        </button>
        {dryRun.progress ? (
          <ProgressBar
            current={dryRun.progress.current}
            total={dryRun.progress.total}
            label={dryRun.progress.file.path}
          />
        ) : null}
        {dryRun.report ? (
          <p className="lf-note">
            {dryRun.report.counts.done} {t('plan.files')} — {t('export.done')}
          </p>
        ) : null}
      </footer>
    </div>
  );
}
