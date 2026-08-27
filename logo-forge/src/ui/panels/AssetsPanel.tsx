import type { LogoRole } from '@/types';
import { ROLE_LABELS } from '@core/illustrator/roles';
import { t } from '@/i18n';
import { Section } from '@ui/components/Section';
import { Toggle } from '@ui/components/Toggle';
import { useApp } from '@ui/state/store';

const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as LogoRole[];

export function AssetsPanel(): JSX.Element {
  const { state, dispatch } = useApp();
  const { assets } = state.settings;

  if (assets.length === 0) {
    return (
      <Section title={t('assets.title')}>
        <p className="lf-empty">{t('doc.none')}</p>
      </Section>
    );
  }

  const allSelected = assets.every((a) => a.selected);

  return (
    <Section
      title={t('assets.title')}
      description="Chaque plan de travail devient une declinaison du logo dans le pack."
    >
      <Toggle
        label={t('assets.selectAll')}
        checked={allSelected}
        onChange={(next) => dispatch({ type: 'assets/setAll', selected: next })}
      />
      <ul className="lf-list">
        {assets.map((asset) => (
          <li key={asset.id} className="lf-list__row">
            <Toggle
              label={asset.name}
              hint={`${Math.round(asset.width)} × ${Math.round(asset.height)} pt`}
              checked={asset.selected}
              onChange={() => dispatch({ type: 'assets/toggle', id: asset.id })}
            />
            <select
              className="lf-input lf-input--compact"
              value={asset.role}
              aria-label={t('assets.role')}
              onChange={(event) =>
                dispatch({
                  type: 'assets/setRole',
                  id: asset.id,
                  role: event.target.value as LogoRole,
                })
              }
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </Section>
  );
}
