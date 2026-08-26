import { ProjectStatus } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/lib/validation';
import { runSubmissionPipeline } from '@/server/pipeline';
import { conflict, forbidden, notFound, requireUser } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/**
 * Soumet un projet au pipeline de publication.
 *
 * Le dossier doit d'abord passer la validation complete : un brouillon
 * incomplet est refuse avant toute consommation de ressources IA.
 */
export async function POST(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();

    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project) throw notFound('Projet introuvable.');
    if (project.seller_id !== user.id) throw forbidden("Ce projet ne vous appartient pas.");
    if (project.status === ProjectStatus.PUBLISHED || project.status === ProjectStatus.SOLD) {
      throw conflict('Ce projet est deja en ligne.');
    }

    // Valide le dossier complet (les 3 couches) avant de lancer le pipeline.
    projectSchema.parse({
      title: project.title,
      tagline: project.tagline,
      category: project.category,
      sector_tags: project.sector_tags,
      problem_statement: project.problem_statement,
      target_market: project.target_market,
      cover_image_url: project.cover_image_url ?? undefined,
      executive_summary: project.executive_summary ?? undefined,
      market_size: project.market_size ?? undefined,
      competitive_advantage: project.competitive_advantage ?? undefined,
      full_description: project.full_description ?? undefined,
      solution_detail: project.solution_detail ?? undefined,
      business_model: project.business_model ?? undefined,
      implementation_steps: project.implementation_steps,
      resources_identified: project.resources_identified ?? undefined,
      images: project.images,
      attachments: project.attachments,
      video_url: project.video_url ?? undefined,
      estimated_cost_min: project.estimated_cost_min ?? undefined,
      estimated_cost_max: project.estimated_cost_max ?? undefined,
      implementation_months: project.implementation_months ?? undefined,
      projected_revenue: project.projected_revenue ?? undefined,
      selling_mode: project.selling_mode,
      fixed_price: project.fixed_price ?? undefined,
      auction_start_price: project.auction_start_price ?? undefined,
      auction_reserve_price: project.auction_reserve_price ?? undefined,
      auction_end_date: project.auction_end_date ?? undefined,
      currency: project.currency,
      similarity_note: project.similarity_note ?? undefined,
    });

    const outcome = await runSubmissionPipeline(project.id);

    return ok({
      status: outcome.status,
      message: outcome.message,
      ai_score: outcome.ai_score,
      display_level: outcome.display_level,
      similarity_status: outcome.similarity_status,
      similarity_max_score: outcome.similarity_max_score,
      similar_projects: outcome.similar_projects,
      content_hash: outcome.content_hash,
      submitted_at: outcome.submitted_at,
      teaser: outcome.teaser,
      slug: outcome.project.slug,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
