import { SimilarityStatus } from '@prisma/client';
import { CheckCircle2, Copy, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SIMILARITY_LABELS } from '@/lib/constants';

const CONFIG: Record<
  SimilarityStatus,
  { variant: 'success' | 'warning' | 'error' | 'muted'; Icon: typeof CheckCircle2 }
> = {
  CLEAR: { variant: 'success', Icon: CheckCircle2 },
  MODERATE: { variant: 'muted', Icon: ShieldQuestion },
  HIGH: { variant: 'warning', Icon: ShieldAlert },
  DUPLICATE: { variant: 'error', Icon: Copy },
};

export function SimilarityBadge({
  status,
}: {
  status: SimilarityStatus | null | undefined;
}): React.JSX.Element | null {
  if (!status) return null;
  const { variant, Icon } = CONFIG[status];

  return (
    <Badge variant={variant}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {SIMILARITY_LABELS[status]}
    </Badge>
  );
}
