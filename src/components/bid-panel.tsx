'use client';

import { Gavel, Loader2, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Countdown } from '@/components/countdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRealtime } from '@/lib/realtime';
import { formatCurrency } from '@/lib/utils';

interface AuctionSnapshot {
  highest_bid: number | null;
  bid_count: number;
  minimum_bid: number;
  reserve_met: boolean;
  ends_at: string | null;
  is_open: boolean;
}

interface BidPanelProps {
  projectId: string;
  currency: string;
  initial: AuctionSnapshot;
  isAuthenticated: boolean;
  isOwner: boolean;
  slug: string;
}

/** Panneau d'enchere : etat en direct, depot d'offre, prolongation anti-sniping. */
export function BidPanel({
  projectId,
  currency,
  initial,
  isAuthenticated,
  isOwner,
  slug,
}: BidPanelProps): React.JSX.Element {
  const router = useRouter();
  const [auction, setAuction] = useState<AuctionSnapshot>(initial);
  const [amount, setAmount] = useState<string>(String(initial.minimum_bid));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { auction?: AuctionSnapshot };
      if (data.auction) setAuction(data.auction);
      router.refresh();
    } catch {
      // Rafraichissement silencieux : l'etat affiche reste celui de la derniere reponse valide.
    }
  }, [projectId, router]);

  useRealtime({
    table: 'Bid',
    filter: `project_id=eq.${projectId}`,
    onChange: () => void refresh(),
    enabled: auction.is_open,
  });

  useEffect(() => {
    setAmount(String(auction.minimum_bid));
  }, [auction.minimum_bid]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isAuthenticated) {
      router.push(`/connexion?callbackUrl=/projets/${slug}`);
      return;
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Saisissez un montant valide.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, amount: value }),
      });

      const data = (await response.json()) as {
        error?: string;
        auction?: AuctionSnapshot;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "L'enchere n'a pas pu etre enregistree.");
        return;
      }

      if (data.auction) setAuction(data.auction);
      setNotice(data.message ?? 'Offre enregistree.');
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <Gavel className="h-5 w-5 text-primary" aria-hidden />
          Enchere
        </h2>
        {auction.ends_at && <Countdown endDate={auction.ends_at} className="text-sm" />}
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Meilleure offre</p>
        <p className="font-display text-3xl font-bold text-primary">
          {auction.highest_bid !== null
            ? formatCurrency(auction.highest_bid, currency)
            : formatCurrency(auction.minimum_bid, currency)}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {auction.bid_count} offre{auction.bid_count > 1 ? 's' : ''}
          </span>
          {auction.highest_bid !== null && (
            <Badge variant={auction.reserve_met ? 'success' : 'warning'}>
              {auction.reserve_met ? 'Prix de reserve atteint' : 'Prix de reserve non atteint'}
            </Badge>
          )}
        </p>
      </div>

      {auction.is_open ? (
        isOwner ? (
          <Alert className="mt-4">
            <AlertDescription>
              Vous etes le vendeur : vous ne pouvez pas encherir sur votre propre projet.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label htmlFor="bid-amount" className="block text-sm font-medium">
              Votre offre (minimum {formatCurrency(auction.minimum_bid, currency)})
            </label>
            <div className="flex gap-2">
              <Input
                id="bid-amount"
                type="number"
                min={auction.minimum_bid}
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <TrendingUp className="h-4 w-4" aria-hidden />
                )}
                Encherir
              </Button>
            </div>

            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {notice && (
              <Alert variant="success">
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-muted-foreground">
              Toute offre deposee dans les 5 dernieres minutes prolonge automatiquement
              l&apos;enchere de 5 minutes.
            </p>
          </form>
        )
      ) : (
        <Alert className="mt-4">
          <AlertDescription>
            Cette enchere est cloturee. Le gagnant a ete notifie et dispose de 48 heures pour
            regler.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
