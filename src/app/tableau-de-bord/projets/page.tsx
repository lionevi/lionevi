import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { AiScoreBadge } from '@/components/ai-score-badge';
import { SimilarityBadge } from '@/components/similarity-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { listSellerProjects } from '@/server/projects';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mes projets',
  robots: { index: false, follow: false },
};

export default async function SellerProjectsPage(): Promise<React.JSX.Element> {
  const user = await requireUser();
  const projects = await listSellerProjects(user.id);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Mes projets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(projects.length)} dossier{projects.length > 1 ? 's' : ''} depose
            {projects.length > 1 ? 's' : ''}.
          </p>
        </div>
        <Button asChild>
          <Link href="/vendre">Nouveau projet</Link>
        </Button>
      </header>

      {projects.length > 0 ? (
        <div className="mt-6 space-y-3">
          {projects.map((project) => {
            const price =
              project.selling_mode === 'AUCTION'
                ? project.auction_start_price
                : project.fixed_price;

            return (
              <Card key={project.id}>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={project.status} />
                      <AiScoreBadge score={project.ai_score} level={project.display_level} />
                      <SimilarityBadge status={project.similarity_status} />
                    </div>

                    <h2 className="mt-2 font-display text-base font-semibold">
                      <Link
                        href={`/tableau-de-bord/projets/${project.id}`}
                        className="hover:text-primary"
                      >
                        {project.title}
                      </Link>
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.category} — {formatNumber(project.views_count)} vues,{' '}
                      {formatNumber(project.saves_count)} favoris,{' '}
                      {formatNumber(project._count.bids)} enchere
                      {project._count.bids > 1 ? 's' : ''}
                      {project.submitted_at && ` — depose le ${formatDate(project.submitted_at)}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-display text-base font-bold text-primary">
                      {price !== null ? formatCurrency(price, project.currency) : '—'}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tableau-de-bord/projets/${project.id}`}>Gerer</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="Aucun projet depose"
            description="Deposez votre premiere idee : empreinte SHA-256, evaluation IA et mise en vente en quelques minutes."
            action={{ href: '/vendre', label: 'Deposer une idee' }}
          />
        </div>
      )}
    </div>
  );
}
