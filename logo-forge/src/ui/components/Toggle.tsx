export function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <label className={`lf-toggle${disabled ? ' lf-toggle--disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="lf-toggle__label">
        {label}
        {hint ? <em className="lf-toggle__hint">{hint}</em> : null}
      </span>
    </label>
  );
}
