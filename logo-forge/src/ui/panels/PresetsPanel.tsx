import { t } from '@/i18n';
import { BUILTIN_PRESETS } from '@core/presets';
import { Section } from '@ui/components/Section';
import { Toggle } from '@ui/components/Toggle';
import { useApp } from '@ui/state/store';

export function PresetsPanel(): JSX.Element {
  const { state, dispatch } = useApp();

  return (
    <Section
      title={t('presets.title')}
      description="Chaque preset regroupe des formats coherents pour un usage donne."
    >
      <ul className="lf-list">
        {BUILTIN_PRESETS.map((preset) => (
          <li key={preset.id} className="lf-list__row lf-list__row--stacked">
            <Toggle
              label={preset.name}
              hint={`${preset.targets.length} ${t('presets.targets')}`}
              checked={state.settings.presetIds.includes(preset.id)}
              onChange={() => dispatch({ type: 'presets/toggle', id: preset.id })}
            />
            <p className="lf-list__description">{preset.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
