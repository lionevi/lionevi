import { Gavel } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Countdown } from '@/components/countdown';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Mes encheres', robots: { index: false, follow: false } };

const BID_STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' | 'error' }> = {
  WINNING: { label: 'En tete', variant: 'success' },
  ACTIVE: { label: 'Depassee', variant: 'warning' },
  LOST: { label: 'Perdue', variant: 'muted' },
  REFUNDED: { label: 'Annulee', variant: 'error' },
};

export default async function MyBidsPage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const bids = await prisma.bid.findMany({
    where: { bidder_id: user.id },
    include: {
      project: {
        select: {
          title: true,
          slug: true,
          currency: true,
          status: true,
          auction_end_date: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // Une seule ligne par projet : l'offre la plus recente.
  const latestByProject = new Map<string, (typeof bids)[number]>();
  for (const bid of bids) {
    if (!latestByProject.has(bid.project_id)) latestByProject.set(bid.project_id, bid);
  }
  const rows = [...latestByProject.values()];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Mes encheres</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Etat de vos offres, projet par projet.
      </p>

      {rows.length > 0 ? (
        <div className="mt-6 space-y-3">
          {rows.map((bid) => {
            const config = BID_STATUS_LABELS[bid.status] ?? BID_STATUS_LABELS.ACTIVE;
            const open =
              bid.project.status === 'PUBLISHED' &&
              bid.project.auction_end_date !== null &&
              bid.project.auction_end_date.getTime() > Date.now();

            return (
              <Card key={bid.id}>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Badge variant={config?.variant ?? 'muted'}>{config?.label ?? bid.status}</Badge>
                    <h2 className="mt-2 font-display text-base font-semibold">
                      <Link href={`/projets/${bid.project.slug}`} className="hover:text-primary">
                        {bid.project.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Votre derniere offre : {formatDateTime(bid.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-display text-base font-bold text-primary">
                      {formatCurrency(bid.amount, bid.project.currency)}
                    </span>
                    {open && bid.project.auction_end_date ? (
                      <Countdown endDate={bid.project.auction_end_date} className="text-xs" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Enchere close</span>
                    )}
                    {bid.status === 'WINNING' && !open && (
                      <Button asChild size="sm">
                        <Link href={`/projets/${bid.project.slug}/paiement`}>Regler</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Gavel}
            title="Vous n'avez pas encore encheri"
            description="Les encheres permettent d'acquerir un dossier complet au juste prix du marche."
            action={{ href: '/encheres', label: 'Voir les encheres en cours' }}
          />
        </div>
      )}
    </div>
  );
}
