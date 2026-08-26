import { Eye, Gavel, Heart, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AiScoreBadge } from '@/components/ai-score-badge';
import { Countdown } from '@/components/countdown';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber, truncate } from '@/lib/utils';
import type { ProjectCard as ProjectCardData } from '@/server/projects';

/** Carte projet de la marketplace (visuel avec degrade, badge de score IA). */
export function ProjectCard({ project }: { project: ProjectCardData }): React.JSX.Element {
  const isAuction = project.selling_mode === 'AUCTION';
  const price = isAuction ? project.auction_start_price : project.fixed_price;
  const isSold = project.status === 'SOLD';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <Link href={`/projets/${project.slug}`} className="card-media block aspect-[16/10] w-full">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-3xl font-extrabold text-primary/25">
              {project.category.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <AiScoreBadge score={project.ai_score} level={project.display_level} />
          {isSold && <Badge variant="muted">Vendu</Badge>}
        </div>

        {isAuction && project.auction_end_date && !isSold && (
          <div className="absolute bottom-3 left-3 z-10 rounded-full bg-card/95 px-2.5 py-1 shadow-sm">
            <Countdown endDate={project.auction_end_date} className="text-xs" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{project.category}</Badge>
          {project.seller.country && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {project.seller.country}
            </span>
          )}
        </div>

        <h3 className="mt-2.5 font-display text-base font-semibold leading-snug">
          <Link href={`/projets/${project.slug}`} className="hover:text-primary">
            {project.title}
          </Link>
        </h3>

        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
          {truncate(project.ai_teaser ?? project.tagline, 130)}
        </p>

        <div className="mt-4 flex items-end justify-between border-t border-border pt-3.5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {isAuction ? 'Enchere des' : 'Prix'}
            </p>
            <p className="font-display text-lg font-bold text-primary">
              {price !== null ? formatCurrency(price, project.currency) : 'Sur demande'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {isAuction && (
              <span className="inline-flex items-center gap-1">
                <Gavel className="h-3.5 w-3.5" aria-hidden />
                {formatNumber(project._count.bids)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden />
              {formatNumber(project.views_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              {formatNumber(project.saves_count)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
