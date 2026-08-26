import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ProjectFilters } from '@/app/projets/filters';
import { EmptyState } from '@/components/empty-state';
import { ProjectCard } from '@/components/project-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { projectFiltersSchema } from '@/lib/validation';
import { listProjects } from '@/server/projects';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explorer les idees',
  description:
    "Parcourez les idees et projets innovants en vente sur IdeaMarket Africa : agriculture, fintech, energie, education et bien d'autres.",
};

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ProjectsPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const parsed = projectFiltersSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : projectFiltersSchema.parse({});
  const { projects, total, page, pages } = await listProjects(filters);

  const buildPageHref = (target: number): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string' && value) params.set(key, value);
    }
    params.set('page', String(target));
    return `/projets?${params.toString()}`;
  };

  return (
    <div className="container py-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Explorer les idees</h1>
        <p className="mt-1.5 text-muted-foreground">
          {formatNumber(total)} projet{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''} a
          l&apos;achat ou aux encheres.
        </p>
      </header>

      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <ProjectFilters />
        </Suspense>
      </div>

      {projects.length > 0 ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={buildPageHref(page - 1)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Precedent
                </Link>
              )}
              <span className="px-3 text-sm text-muted-foreground">
                Page {page} sur {pages}
              </span>
              {page < pages && (
                <Link
                  href={buildPageHref(page + 1)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Suivant
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={Search}
            title="Aucun projet ne correspond a votre recherche"
            description="Elargissez vos criteres ou explorez toutes les categories disponibles."
            action={{ href: '/projets', label: 'Voir tous les projets' }}
          />
        </div>
      )}
    </div>
  );
}
