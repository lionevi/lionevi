'use client';

import type { ProjectStatus, SimilarityStatus } from '@prisma/client';
import { Check, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AiScoreBadge } from '@/components/ai-score-badge';
import { SimilarityBadge } from '@/components/similarity-badge';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { shortHash } from '@/lib/anteriority';
import { formatDateTime } from '@/lib/utils';

interface QueueItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  status: ProjectStatus;
  ai_score: number | null;
  similarity_status: SimilarityStatus | null;
  similarity_note: string | null;
  content_hash: string | null;
  submitted_at: string | null;
  seller: { id: string; name: string; email: string; country: string };
  similar_projects: Array<{ project_id: string; title: string; score: number; reason: string }>;
}

/** File de moderation : approbation ou refus motive. */
export function ModerationQueue({ items }: { items: QueueItem[] }): React.JSX.Element {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, decision: 'APPROVE' | 'REJECT'): Promise<void> {
    if (decision === 'REJECT' && !reasons[id]?.trim()) {
      setError('Indiquez un motif de refus : il est transmis au vendeur.');
      return;
    }

    setError(null);
    setPending(id);

    try {
      const response = await fetch(`/api/admin/projets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason: reasons[id] }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "La decision n'a pas pu etre enregistree.");
        return;
      }
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="py-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <AiScoreBadge score={item.ai_score} />
              <SimilarityBadge status={item.similarity_status} />
              <Badge variant="outline">{item.category}</Badge>
            </div>

            <h3 className="mt-2.5 font-display text-base font-semibold">
              <Link href={`/projets/${item.slug}`} className="hover:text-primary">
                {item.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.tagline}</p>

            <p className="mt-2 text-xs text-muted-foreground">
              {item.seller.name} ({item.seller.email}) — {item.seller.country}
              {item.submitted_at && ` — soumis le ${formatDateTime(item.submitted_at)}`}
              {item.content_hash && ` — empreinte ${shortHash(item.content_hash)}`}
            </p>

            {item.similarity_note && (
              <Alert variant="info" className="mt-3">
                <AlertDescription>
                  <strong>Note de differenciation :</strong> {item.similarity_note}
                </AlertDescription>
              </Alert>
            )}

            {item.similar_projects.length > 0 && (
              <ul className="mt-3 space-y-2">
                {item.similar_projects.map((similar) => (
                  <li key={similar.project_id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{similar.title}</span>
                      <Badge variant={similar.score > 60 ? 'warning' : 'muted'}>
                        {similar.score}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{similar.reason}</p>
                  </li>
                ))}
              </ul>
            )}

            <Textarea
              className="mt-4"
              rows={2}
              placeholder="Motif du refus (transmis au vendeur)"
              value={reasons[item.id] ?? ''}
              onChange={(event) =>
                setReasons((current) => ({ ...current, [item.id]: event.target.value }))
              }
              aria-label={`Motif du refus pour ${item.title}`}
            />

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => void decide(item.id, 'APPROVE')}
                disabled={pending !== null}
              >
                {pending === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Publier
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-error"
                onClick={() => void decide(item.id, 'REJECT')}
                disabled={pending !== null}
              >
                <X className="h-4 w-4" />
                Refuser
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
