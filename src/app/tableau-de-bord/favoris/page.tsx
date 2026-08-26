import { Heart } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { ProjectCard } from '@/components/project-card';
import { prisma } from '@/lib/prisma';
import { projectCardSelect } from '@/server/projects';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Favoris', robots: { index: false, follow: false } };

export default async function SavedProjectsPage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const saved = await prisma.savedProject.findMany({
    where: { user_id: user.id },
    include: { project: { select: projectCardSelect } },
    orderBy: { created_at: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Favoris</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les idees que vous suivez de pres.
      </p>

      {saved.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((entry) => (
            <ProjectCard key={entry.project_id} project={entry.project} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Heart}
            title="Aucun favori"
            description="Enregistrez les projets qui vous interessent pour les retrouver ici et suivre leurs encheres."
            action={{ href: '/projets', label: 'Explorer les projets' }}
          />
        </div>
      )}
    </div>
  );
}
