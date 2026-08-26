'use client';

import { Timer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn, formatCountdown } from '@/lib/utils';

interface CountdownProps {
  endDate: Date | string;
  className?: string;
  /** Passe en rouge sous ce seuil (en heures). */
  urgentBelowHours?: number;
}

/** Compte a rebours d'enchere, rafraichi chaque seconde. */
export function Countdown({
  endDate,
  className,
  urgentBelowHours = 6,
}: CountdownProps): React.JSX.Element {
  // Memoise la date pour que l'effet ne se reabonne pas a chaque rendu.
  const end = useMemo(
    () => (typeof endDate === 'string' ? new Date(endDate) : endDate),
    [endDate],
  );
  const [label, setLabel] = useState(() => formatCountdown(end));

  useEffect(() => {
    const timer = setInterval(() => setLabel(formatCountdown(end)), 1000);
    return () => clearInterval(timer);
  }, [end]);

  const msLeft = end.getTime() - Date.now();
  const isUrgent = msLeft > 0 && msLeft < urgentBelowHours * 3_600_000;
  const isOver = msLeft <= 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums',
        isOver ? 'text-muted-foreground' : isUrgent ? 'text-error' : 'text-foreground',
        className,
      )}
    >
      <Timer className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}
