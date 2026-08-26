'use client';

import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface NdaGateProps {
  projectId: string;
  ndaText: string;
  isAuthenticated: boolean;
}

/**
 * Portail de la couche 2 : signature electronique du NDA.
 * L'adresse IP et le user-agent sont enregistres cote serveur au moment de la
 * signature — ils constituent la preuve de l'engagement.
 */
export function NdaGate({ projectId, ndaText, isAuthenticated }: NdaGateProps): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sign(): Promise<void> {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/nda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'La signature a echoue.');
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
        <Lock className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
        <h3 className="mt-3 font-display text-base font-semibold">Contenu protege</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connectez-vous puis signez l&apos;accord de confidentialite pour acceder au resume
          executif, a la taille de marche et a l&apos;avantage concurrentiel.
        </p>
        <Button asChild className="mt-4">
          <a href="/connexion">Se connecter</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
      <ShieldCheck className="mx-auto h-6 w-6 text-primary" aria-hidden />
      <h3 className="mt-3 font-display text-base font-semibold">
        Debloquez le resume executif
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        Le resume executif, la taille de marche estimee et l&apos;avantage concurrentiel sont
        reserves aux acheteurs ayant signe l&apos;accord de confidentialite. C&apos;est gratuit et
        immediat.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4">Signer le NDA</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accord de confidentialite</DialogTitle>
            <DialogDescription>
              Lisez attentivement : votre acceptation vaut signature electronique.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground/85">
            {ndaText.split('\n\n').map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>

          {error && (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="nda-accept"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
            />
            <Label htmlFor="nda-accept" className="text-sm font-normal leading-snug">
              J&apos;ai lu et j&apos;accepte les termes de cet accord de confidentialite.
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void sign()} disabled={!accepted || loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Signer et acceder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
