import { Gavel } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { ProjectCard } from '@/components/project-card';
import { prisma } from '@/lib/prisma';
import { projectCardSelect } from '@/server/projects';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Encheres en cours',
  description:
    'Suivez les encheres ouvertes sur IdeaMarket Africa et remportez les droits sur un projet complet.',
};

export default async function AuctionsPage(): Promise<React.JSX.Element> {
  const [live, closingSoon] = await Promise.all([
    prisma.project.findMany({
      where: {
        status: 'PUBLISHED',
        selling_mode: 'AUCTION',
        auction_end_date: { gt: new Date() },
      },
      select: projectCardSelect,
      orderBy: { auction_end_date: 'asc' },
    }),
    prisma.project.count({
      where: {
        status: 'PUBLISHED',
        selling_mode: 'AUCTION',
        auction_end_date: { gt: new Date(), lte: new Date(Date.now() + 24 * 3_600_000) },
      },
    }),
  ]);

  return (
    <div className="container py-10">
      <header>
        <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold">
          <Gavel className="h-7 w-7 text-primary" aria-hidden />
          Encheres en cours
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          {live.length} enchere{live.length > 1 ? 's' : ''} ouverte{live.length > 1 ? 's' : ''}
          {closingSoon > 0 && ` — ${closingSoon} se termine${closingSoon > 1 ? 'nt' : ''} dans moins de 24 h.`}
        </p>
      </header>

      {live.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={Gavel}
            title="Aucune enchere en cours"
            description="Revenez bientot, ou mettez votre propre idee aux encheres."
            action={{ href: '/vendre', label: 'Mettre une idee aux encheres' }}
          />
        </div>
      )}
    </div>
  );
}
