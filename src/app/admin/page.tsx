import {
  Ban,
  Gavel,
  MessageSquareOff,
  Package,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { getPlatformStats } from '@/server/admin';
import { requireAdmin } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  await requireAdmin();

  const [stats, recentUsers, recentTransactions] = await Promise.all([
    getPlatformStats(),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, country: true, is_banned: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 8,
    }),
    prisma.transaction.findMany({
      include: {
        project: { select: { title: true, currency: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 8,
    }),
  ]);

  const cards = [
    { label: 'Membres', value: formatNumber(stats.users), icon: Users },
    { label: 'Projets en ligne', value: formatNumber(stats.projects_published), icon: Package },
    { label: 'En attente de moderation', value: formatNumber(stats.projects_pending), icon: ShieldAlert },
    { label: 'Encheres actives', value: formatNumber(stats.active_auctions), icon: Gavel },
    { label: 'Ventes finalisees', value: formatNumber(stats.transactions_completed), icon: TrendingUp },
    { label: 'Volume brut', value: formatCurrency(stats.gross_volume), icon: Wallet },
    { label: 'Revenus plateforme', value: formatCurrency(stats.platform_revenue), icon: Wallet },
    { label: 'Messages bloques', value: formatNumber(stats.blocked_messages), icon: MessageSquareOff },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4">
            <card.icon className="h-5 w-5 text-accent" aria-hidden />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 font-display text-lg font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {stats.projects_pending > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 p-4">
          <p className="text-sm font-medium text-[#B45309]">
            {stats.projects_pending} dossier{stats.projects_pending > 1 ? 's' : ''} en attente de
            decision.
          </p>
          <Button asChild size="sm">
            <Link href="/admin/moderation">Ouvrir la file</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Derniers inscrits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {recentUsers.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                      {member.is_banned && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-error">
                          <Ban className="h-3 w-3" aria-hidden />
                          suspendu
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email} — {member.country}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(member.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dernieres transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentTransactions.map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{transaction.project.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {transaction.seller.name} → {transaction.buyer.name} — {transaction.status}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatCurrency(transaction.amount, transaction.project.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune transaction enregistree.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
