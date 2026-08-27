import type { PlanWarning } from '@/types';

export function WarningList({
  warnings,
}: {
  warnings: readonly PlanWarning[];
}): JSX.Element | null {
  if (warnings.length === 0) return null;
  return (
    <ul className="lf-warnings">
      {warnings.map((warning, index) => (
        <li
          key={`${warning.code}-${index}`}
          className={`lf-warning lf-warning--${warning.severity}`}
        >
          {warning.message}
        </li>
      ))}
    </ul>
  );
}
