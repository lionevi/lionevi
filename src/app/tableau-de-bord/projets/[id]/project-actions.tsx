'use client';

import type { ProjectStatus } from '@prisma/client';
import { ExternalLink, Loader2, Pencil, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ProjectActionsProps {
  projectId: string;
  slug: string;
  status: ProjectStatus;
  hasBids: boolean;
}

/** Actions du vendeur sur son projet : publication, modification, suppression. */
export function ProjectActions({
  projectId,
  slug,
  status,
  hasBids,
}: ProjectActionsProps): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<'submit' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editable = status === 'DRAFT' || status === 'REJECTED' || status === 'PENDING_REVIEW';
  const deletable = editable && !hasBids;

  async function submitForReview(): Promise<void> {
    setError(null);
    setLoading('submit');

    try {
      const response = await fetch(`/api/projects/${projectId}/submit`, { method: 'POST' });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? 'La soumission a echoue.');
        return;
      }
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(null);
    }
  }

  async function remove(): Promise<void> {
    if (!window.confirm('Supprimer definitivement ce projet ? Cette action est irreversible.')) {
      return;
    }

    setError(null);
    setLoading('delete');

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'La suppression a echoue.');
        return;
      }
      router.push('/tableau-de-bord/projets');
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {(status === 'PUBLISHED' || status === 'SOLD') && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/projets/${slug}`}>
              <ExternalLink className="h-4 w-4" />
              Voir l&apos;annonce
            </Link>
          </Button>
        )}

        {editable && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/vendre?projet=${projectId}`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
        )}

        {editable && (
          <Button size="sm" onClick={() => void submitForReview()} disabled={loading !== null}>
            {loading === 'submit' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Soumettre
          </Button>
        )}

        {deletable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void remove()}
            disabled={loading !== null}
            className="text-error hover:bg-error/10"
          >
            {loading === 'delete' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Supprimer
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" className="max-w-sm">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
