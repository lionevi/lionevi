import { ShoppingBag } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Mes ventes', robots: { index: false, follow: false } };

export default async function SalesPage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const [sales, totals] = await Promise.all([
    prisma.transaction.findMany({
      where: { seller_id: user.id },
      include: {
        project: { select: { title: true, slug: true, currency: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.transaction.aggregate({
      where: { seller_id: user.id, status: 'COMPLETED' },
      _sum: { amount: true, seller_earnings: true, platform_fee: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Mes ventes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Suivi de vos cessions et de vos revenus nets.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Volume vendu', value: totals._sum.amount ?? 0 },
          { label: 'Net encaisse', value: totals._sum.seller_earnings ?? 0 },
          { label: 'Commissions versees', value: totals._sum.platform_fee ?? 0 },
        ].map((entry) => (
          <div key={entry.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{entry.label}</p>
            <p className="mt-1 font-display text-xl font-bold">{formatCurrency(entry.value)}</p>
          </div>
        ))}
      </div>

      {sales.length > 0 ? (
        <div className="mt-6 space-y-3">
          {sales.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Badge
                    variant={
                      sale.status === 'COMPLETED'
                        ? 'success'
                        : sale.status === 'PENDING'
                          ? 'warning'
                          : sale.status === 'DISPUTED'
                            ? 'error'
                            : 'muted'
                    }
                  >
                    {sale.status}
                  </Badge>
                  <h2 className="mt-2 font-display text-base font-semibold">
                    <Link href={`/projets/${sale.project.slug}`} className="hover:text-primary">
                      {sale.project.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Acquis par {sale.buyer.name} le {formatDate(sale.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="font-display text-base font-bold text-primary">
                    {formatCurrency(sale.seller_earnings, sale.project.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    sur {formatCurrency(sale.amount, sale.project.currency)}
                  </span>
                  {sale.status === 'COMPLETED' && (
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/transactions/${sale.id}/contrat`}>Contrat</a>
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
            icon={ShoppingBag}
            title="Aucune vente enregistree"
            description="Publiez une idee bien documentee : les dossiers precis se vendent plus vite et plus cher."
            action={{ href: '/vendre', label: 'Deposer une idee' }}
          />
        </div>
      )}
    </div>
  );
}
