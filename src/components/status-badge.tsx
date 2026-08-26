import { ProjectStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'muted' | 'default' }
> = {
  DRAFT: { label: 'Brouillon', variant: 'muted' },
  PENDING_REVIEW: { label: 'En validation', variant: 'warning' },
  SIMILARITY_CHECK: { label: 'Analyse en cours', variant: 'warning' },
  PUBLISHED: { label: 'En ligne', variant: 'success' },
  SOLD: { label: 'Vendu', variant: 'default' },
  ARCHIVED: { label: 'Archive', variant: 'muted' },
  REJECTED: { label: 'Refuse', variant: 'error' },
};

/** Badge de statut d'un projet, libelle en francais. */
export function StatusBadge({ status }: { status: ProjectStatus }): React.JSX.Element {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
