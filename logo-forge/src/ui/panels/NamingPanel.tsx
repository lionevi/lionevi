import type { NameCase } from '@/types';
import { t } from '@/i18n';
import { NAME_TOKENS } from '@core/naming';
import { SelectField, TextField } from '@ui/components/Field';
import { Section } from '@ui/components/Section';
import { Toggle } from '@ui/components/Toggle';
import { useApp } from '@ui/state/store';

const CASE_OPTIONS: readonly { value: NameCase; label: string }[] = [
  { value: 'kebab', label: 'mon-logo-couleur' },
  { value: 'snake', label: 'mon_logo_couleur' },
  { value: 'camel', label: 'monLogoCouleur' },
  { value: 'pascal', label: 'MonLogoCouleur' },
  { value: 'original', label: 'Nom d origine' },
];

export function NamingPanel(): JSX.Element {
  const { state, dispatch, plan } = useApp();
  const { naming } = state.settings;
  const sample = plan.files[0]?.path;

  return (
    <Section
      title={t('naming.title')}
      description="Les tokens sont remplaces pour chaque fichier ; un token inconnu est signale, jamais fatal."
    >
      <TextField
        label={t('naming.template')}
        value={naming.template}
        onChange={(template) => dispatch({ type: 'naming/patch', patch: { template } })}
      />
      <p className="lf-tokens">
        {NAME_TOKENS.map((token) => (
          <button
            key={token}
            type="button"
            className="lf-token"
            onClick={() =>
              dispatch({
                type: 'naming/patch',
                patch: { template: `${naming.template}-{${token}}` },
              })
            }
          >
            {`{${token}}`}
          </button>
        ))}
      </p>
      <SelectField
        label={t('naming.case')}
        value={naming.case}
        options={CASE_OPTIONS}
        onChange={(value) => dispatch({ type: 'naming/patch', patch: { case: value } })}
      />
      <Toggle
        label={t('naming.ascii')}
        hint="Evite les noms casses sur Windows et dans les archives ZIP"
        checked={naming.asciiOnly}
        onChange={(asciiOnly) => dispatch({ type: 'naming/patch', patch: { asciiOnly } })}
      />
      {sample ? (
        <p className="lf-preview">
          <strong>{t('naming.preview')} :</strong> <code>{sample}</code>
        </p>
      ) : null}
    </Section>
  );
}
