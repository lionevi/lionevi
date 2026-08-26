import { Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { WithdrawalForm } from '@/app/tableau-de-bord/portefeuille/withdrawal-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { providersForCountry } from '@/lib/payments/mobile-money';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portefeuille',
  robots: { index: false, follow: false },
};

export default async function WalletPage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const [profile, sales, purchases] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { wallet_balance: true, country: true, phone: true },
    }),
    prisma.transaction.findMany({
      where: { seller_id: user.id, status: 'COMPLETED' },
      select: {
        id: true,
        seller_earnings: true,
        created_at: true,
        project: { select: { title: true, currency: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: { buyer_id: user.id, status: 'COMPLETED', payment_method: 'WALLET' },
      select: {
        id: true,
        amount: true,
        created_at: true,
        project: { select: { title: true, currency: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    }),
  ]);

  const movements = [
    ...sales.map((sale) => ({
      id: `in-${sale.id}`,
      label: `Vente — ${sale.project.title}`,
      amount: sale.seller_earnings,
      currency: sale.project.currency,
      date: sale.created_at,
      direction: 'in' as const,
    })),
    ...purchases.map((purchase) => ({
      id: `out-${purchase.id}`,
      label: `Achat — ${purchase.project.title}`,
      amount: purchase.amount,
      currency: purchase.project.currency,
      date: purchase.created_at,
      direction: 'out' as const,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const providers = providersForCountry(profile.country).map((provider) => ({
    method: provider.method,
    label: provider.label,
  }));

  return (
    <div>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
        <Wallet className="h-6 w-6 text-primary" aria-hidden />
        Portefeuille
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vos revenus de vente sont credites ici, puis retirables vers votre compte Mobile Money.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Solde disponible
              </p>
              <p className="mt-1 font-display text-4xl font-bold text-primary">
                {formatCurrency(profile.wallet_balance)}
              </p>
            </CardContent>
          </Card>

          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length > 0 ? (
                <ul className="divide-y divide-border">
                  {movements.map((movement) => (
                    <li key={movement.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{movement.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(movement.date)}</p>
                      </div>
                      <Badge variant={movement.direction === 'in' ? 'success' : 'muted'}>
                        {movement.direction === 'in' ? '+' : '−'}
                        {formatCurrency(movement.amount, movement.currency)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun mouvement pour le moment.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <WithdrawalForm
          balance={profile.wallet_balance}
          defaultPhone={profile.phone ?? ''}
          providers={providers}
        />
      </div>
    </div>
  );
}
