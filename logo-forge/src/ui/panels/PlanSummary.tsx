import { t } from '@/i18n';
import { planStats } from '@core/export/planner';
import { WarningList } from '@ui/components/WarningList';
import { useApp } from '@ui/state/store';

export function PlanSummary(): JSX.Element {
  const { plan } = useApp();
  const stats = planStats(plan);

  return (
    <div className="lf-summary">
      <div className="lf-summary__counts">
        <strong>{stats.files}</strong> {t('plan.files')} · <strong>{stats.folders}</strong>{' '}
        {t('plan.folders')}
      </div>
      <WarningList warnings={plan.warnings} />
    </div>
  );
}
