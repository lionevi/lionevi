export function ProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label?: string;
}): JSX.Element {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="lf-progress">
      <div className="lf-progress__track">
        <div className="lf-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="lf-progress__label">
        {current} / {total}
        {label ? ` — ${label}` : ''}
      </span>
    </div>
  );
}
