import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Mes achats', robots: { index: false, follow: false } };

export default async function PurchasesPage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const purchases = await prisma.transaction.findMany({
    where: { buyer_id: user.id },
    include: {
      project: { select: { title: true, slug: true, currency: true, category: true } },
      seller: { select: { name: true } },
      review: { select: { id: true, rating: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Mes achats</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Retrouvez vos dossiers acquis et leurs contrats de cession.
      </p>

      {purchases.length > 0 ? (
        <div className="mt-6 space-y-3">
          {purchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        purchase.status === 'COMPLETED'
                          ? 'success'
                          : purchase.status === 'PENDING'
                            ? 'warning'
                            : 'muted'
                      }
                    >
                      {purchase.status === 'COMPLETED'
                        ? 'Finalise'
                        : purchase.status === 'PENDING'
                          ? 'Paiement en attente'
                          : purchase.status === 'REFUNDED'
                            ? 'Rembourse'
                            : 'En litige'}
                    </Badge>
                    <Badge variant="outline">{purchase.project.category}</Badge>
                  </div>

                  <h2 className="mt-2 font-display text-base font-semibold">
                    <Link href={`/projets/${purchase.project.slug}`} className="hover:text-primary">
                      {purchase.project.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vendu par {purchase.seller.name} — {formatDate(purchase.created_at)} —{' '}
                    {PAYMENT_METHOD_LABELS[purchase.payment_method]}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="font-display text-base font-bold text-primary">
                    {formatCurrency(purchase.amount, purchase.project.currency)}
                  </span>
                  {purchase.status === 'COMPLETED' && (
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/api/transactions/${purchase.id}/contrat`}>Contrat</a>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/projets/${purchase.project.slug}`}>Ouvrir</Link>
                      </Button>
                    </div>
                  )}
                  {purchase.status === 'PENDING' && (
                    <Button asChild size="sm">
                      <Link href={`/projets/${purchase.project.slug}/paiement`}>
                        Reprendre le paiement
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="Aucun achat pour le moment"
            description="Explorez la marketplace et trouvez le projet qui correspond a vos moyens et a votre marche."
            action={{ href: '/projets', label: 'Explorer les projets' }}
          />
        </div>
      )}
    </div>
  );
}
