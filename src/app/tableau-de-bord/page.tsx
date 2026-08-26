import { ProjectStatus } from '@prisma/client';
import { ArrowUpRight, Gavel, Package, ShoppingBag, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tableau de bord',
  robots: { index: false, follow: false },
};

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const [profile, projectCount, publishedCount, salesAgg, purchaseCount, activeBids, recentProjects] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { name: true, wallet_balance: true, created_at: true },
      }),
      prisma.project.count({ where: { seller_id: user.id } }),
      prisma.project.count({ where: { seller_id: user.id, status: ProjectStatus.PUBLISHED } }),
      prisma.transaction.aggregate({
        where: { seller_id: user.id, status: 'COMPLETED' },
        _sum: { seller_earnings: true },
        _count: true,
      }),
      prisma.transaction.count({ where: { buyer_id: user.id, status: 'COMPLETED' } }),
      prisma.bid.count({ where: { bidder_id: user.id, status: { in: ['ACTIVE', 'WINNING'] } } }),
      prisma.project.findMany({
        where: { seller_id: user.id },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          ai_score: true,
          views_count: true,
          updated_at: true,
        },
        orderBy: { updated_at: 'desc' },
        take: 5,
      }),
    ]);

  const stats = [
    {
      label: 'Solde du portefeuille',
      value: formatCurrency(profile.wallet_balance),
      icon: Wallet,
      href: '/tableau-de-bord/portefeuille',
    },
    {
      label: 'Projets deposes',
      value: `${formatNumber(projectCount)} (${publishedCount} en ligne)`,
      icon: Package,
      href: '/tableau-de-bord/projets',
    },
    {
      label: 'Ventes realisees',
      value: `${formatNumber(salesAgg._count)} — ${formatCurrency(salesAgg._sum.seller_earnings ?? 0)}`,
      icon: ShoppingBag,
      href: '/tableau-de-bord/ventes',
    },
    {
      label: 'Encheres en cours',
      value: formatNumber(activeBids),
      icon: Gavel,
      href: '/tableau-de-bord/encheres',
    },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Bonjour {profile.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Membre depuis le {formatDate(profile.created_at)} — {formatNumber(purchaseCount)} achat
            {purchaseCount > 1 ? 's' : ''} realise{purchaseCount > 1 ? 's' : ''}.
          </p>
        </div>
        <Button asChild>
          <Link href="/vendre">Deposer une idee</Link>
        </Button>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-primary" aria-hidden />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-lg font-bold">{stat.value}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Activite recente sur vos projets</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tableau-de-bord/projets">Tout voir</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentProjects.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentProjects.map((project) => (
                <li key={project.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/tableau-de-bord/projets/${project.id}`}
                      className="truncate font-medium hover:text-primary"
                    >
                      {project.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatNumber(project.views_count)} vues — mis a jour le{' '}
                      {formatDate(project.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {project.ai_score !== null && (
                      <span className="text-sm font-semibold">{Math.round(project.ai_score)}</span>
                    )}
                    <StatusBadge status={project.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Vous n&apos;avez pas encore depose d&apos;idee.{' '}
              <Link href="/vendre" className="font-medium text-primary hover:underline">
                Commencer maintenant
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
