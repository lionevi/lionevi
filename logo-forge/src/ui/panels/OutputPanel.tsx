import type { GroupBy } from '@/types';
import { t } from '@/i18n';
import { SelectField, TextField } from '@ui/components/Field';
import { Section } from '@ui/components/Section';
import { Toggle } from '@ui/components/Toggle';
import { useApp } from '@ui/state/store';

const GROUP_OPTIONS: readonly { value: GroupBy; label: string }[] = [
  { value: 'usage', label: 'Par usage (recommande)' },
  { value: 'format', label: 'Par format' },
  { value: 'variant', label: 'Par declinaison' },
  { value: 'asset', label: 'Par plan de travail' },
];

export function OutputPanel(): JSX.Element {
  const { state, dispatch, plan } = useApp();
  const { output } = state.settings;

  return (
    <Section title={t('output.title')}>
      <TextField
        label={t('brand.name')}
        value={state.settings.brand.name}
        onChange={(name) => dispatch({ type: 'brand/setName', name })}
      />
      <TextField
        label={t('output.root')}
        value={output.rootFolderTemplate}
        onChange={(rootFolderTemplate) =>
          dispatch({ type: 'output/patch', patch: { rootFolderTemplate } })
        }
      />
      <SelectField
        label={t('output.groupBy')}
        value={output.groupBy}
        options={GROUP_OPTIONS}
        onChange={(groupBy) => dispatch({ type: 'output/patch', patch: { groupBy } })}
      />
      <Toggle
        label={t('output.readme')}
        checked={output.includeReadme}
        onChange={(includeReadme) => dispatch({ type: 'output/patch', patch: { includeReadme } })}
      />
      <Toggle
        label={t('output.guidelines')}
        checked={output.includeGuidelines}
        onChange={(includeGuidelines) =>
          dispatch({ type: 'output/patch', patch: { includeGuidelines } })
        }
      />
      <Toggle
        label={t('output.zip')}
        checked={output.createZip}
        onChange={(createZip) => dispatch({ type: 'output/patch', patch: { createZip } })}
      />
      <p className="lf-preview">
        <code>{plan.rootFolder}/</code>
      </p>
    </Section>
  );
}
