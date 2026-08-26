import type { DisplayLevel } from '@prisma/client';
import { Sparkles } from 'lucide-react';
import { DISPLAY_LEVEL_STYLES, displayLevelFromScore } from '@/lib/scoring';
import { cn } from '@/lib/utils';

interface AiScoreBadgeProps {
  score: number | null | undefined;
  level?: DisplayLevel | null;
  showScore?: boolean;
  className?: string;
}

/**
 * Badge de score IA.
 * Le niveau stocke en base fait foi ; a defaut il est recalcule depuis le score.
 */
export function AiScoreBadge({
  score,
  level,
  showScore = true,
  className,
}: AiScoreBadgeProps): React.JSX.Element | null {
  if (score === null || score === undefined) return null;

  const resolved = level ?? displayLevelFromScore(score);
  const style = DISPLAY_LEVEL_STYLES[resolved];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        style.className,
        className,
      )}
      title={`Score d'evaluation IA : ${score}/100`}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden />
      {style.label}
      {showScore && <span className="font-semibold opacity-80">{Math.round(score)}</span>}
    </span>
  );
}
