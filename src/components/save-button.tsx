'use client';

import { Heart, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  projectId: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
}

/** Bouton favori : bascule optimiste avec retour arriere en cas d'echec. */
export function SaveButton({
  projectId,
  initialSaved,
  isAuthenticated,
}: SaveButtonProps): React.JSX.Element {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle(): Promise<void> {
    if (!isAuthenticated) {
      router.push(`/connexion?callbackUrl=/projets`);
      return;
    }

    const previous = saved;
    setSaved(!previous);
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/save`, { method: 'POST' });
      if (!response.ok) throw new Error('echec');
      const data = (await response.json()) as { saved: boolean };
      setSaved(data.saved);
      router.refresh();
    } catch {
      setSaved(previous);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void toggle()}
      disabled={loading}
      aria-pressed={saved}
      aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Heart className={cn('h-4 w-4', saved && 'fill-primary text-primary')} aria-hidden />
      )}
      {saved ? 'Enregistre' : 'Enregistrer'}
    </Button>
  );
}
