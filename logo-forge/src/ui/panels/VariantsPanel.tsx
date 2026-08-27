import { t } from '@/i18n';
import { contrastRatio, MIN_GRAPHIC_CONTRAST } from '@core/variants/contrast';
import { Section } from '@ui/components/Section';
import { Toggle } from '@ui/components/Toggle';
import { useApp } from '@ui/state/store';

export function VariantsPanel(): JSX.Element {
  const { state, dispatch } = useApp();

  return (
    <Section
      title={t('variants.title')}
      description="Les declinaisons sont generees sur une copie du document : l original n est jamais modifie."
    >
      <ul className="lf-list">
        {state.settings.variants.map((variant) => {
          const ratio =
            variant.color && variant.background
              ? contrastRatio(variant.color, variant.background)
              : null;
          const lowContrast = ratio !== null && ratio < MIN_GRAPHIC_CONTRAST;

          return (
            <li key={variant.id} className="lf-list__row">
              <Toggle
                label={variant.label}
                hint={variant.background ? variant.background : t('variants.transparent')}
                checked={variant.enabled}
                onChange={() => dispatch({ type: 'variants/toggle', id: variant.id })}
              />
              <div className="lf-swatches">
                {variant.color ? (
                  <span className="lf-swatch" style={{ background: variant.color }} />
                ) : null}
                <input
                  className="lf-color"
                  type="color"
                  aria-label={t('variants.background')}
                  value={variant.background ?? '#ffffff'}
                  onChange={(event) =>
                    dispatch({
                      type: 'variants/patch',
                      id: variant.id,
                      patch: { background: event.target.value },
                    })
                  }
                />
                {variant.background ? (
                  <button
                    type="button"
                    className="lf-link"
                    onClick={() =>
                      dispatch({
                        type: 'variants/patch',
                        id: variant.id,
                        patch: { background: null },
                      })
                    }
                  >
                    {t('variants.transparent')}
                  </button>
                ) : null}
              </div>
              {lowContrast ? (
                <span className="lf-badge lf-badge--warning">contraste {ratio?.toFixed(1)}:1</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
