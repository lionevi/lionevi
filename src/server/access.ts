import { ProjectStatus, type Project } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Niveaux de divulgation d'un projet.
 * - PUBLIC : visible de tous ;
 * - NDA : debloque apres signature de l'accord de confidentialite ;
 * - OWNED : debloque apres achat (ou pour le vendeur et l'administration).
 */
export type AccessLevel = 'PUBLIC' | 'NDA' | 'OWNED';

export interface ProjectAccess {
  level: AccessLevel;
  is_owner: boolean;
  is_buyer: boolean;
  is_admin: boolean;
  has_nda: boolean;
}

export const ACCESS_WEIGHT: Record<AccessLevel, number> = { PUBLIC: 0, NDA: 1, OWNED: 2 };

export function hasAtLeast(access: ProjectAccess, level: AccessLevel): boolean {
  return ACCESS_WEIGHT[access.level] >= ACCESS_WEIGHT[level];
}

/** Determine le niveau d'acces d'un utilisateur sur un projet. */
export async function resolveProjectAccess(
  project: Pick<Project, 'id' | 'seller_id'>,
  user: { id: string; role: string } | null,
): Promise<ProjectAccess> {
  if (!user) {
    return { level: 'PUBLIC', is_owner: false, is_buyer: false, is_admin: false, has_nda: false };
  }

  const isOwner = project.seller_id === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (isOwner || isAdmin) {
    return { level: 'OWNED', is_owner: isOwner, is_buyer: false, is_admin: isAdmin, has_nda: true };
  }

  const [transaction, nda] = await Promise.all([
    prisma.transaction.findFirst({
      where: { project_id: project.id, buyer_id: user.id, status: { in: ['COMPLETED', 'DISPUTED'] } },
      select: { id: true },
    }),
    prisma.nDAgreement.findUnique({
      where: { user_id_project_id: { user_id: user.id, project_id: project.id } },
      select: { id: true },
    }),
  ]);

  if (transaction) {
    return { level: 'OWNED', is_owner: false, is_buyer: true, is_admin: false, has_nda: true };
  }
  if (nda) {
    return { level: 'NDA', is_owner: false, is_buyer: false, is_admin: false, has_nda: true };
  }
  return { level: 'PUBLIC', is_owner: false, is_buyer: false, is_admin: false, has_nda: false };
}

/** Champs de la couche 1 — toujours visibles. */
export const PUBLIC_PROJECT_FIELDS = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  category: true,
  sector_tags: true,
  problem_statement: true,
  target_market: true,
  cover_image_url: true,
  images: true,
  video_url: true,
  estimated_cost_min: true,
  estimated_cost_max: true,
  implementation_months: true,
  selling_mode: true,
  fixed_price: true,
  auction_start_price: true,
  auction_end_date: true,
  currency: true,
  status: true,
  display_level: true,
  ai_score: true,
  ai_teaser: true,
  content_hash: true,
  submitted_at: true,
  similarity_status: true,
  views_count: true,
  saves_count: true,
  seller_id: true,
  created_at: true,
  updated_at: true,
} as const;

export interface LayeredProject {
  layer1: Record<string, unknown>;
  layer2: Record<string, unknown> | null;
  layer3: Record<string, unknown> | null;
}

type ProjectWithAttachments = Project & { attachments: unknown[] };

/**
 * Filtre un projet selon le niveau d'acces.
 * Le prix de reserve d'une enchere n'est jamais expose en dehors du vendeur et
 * de l'administration, meme apres achat.
 */
export function applyAccessFilter(
  project: ProjectWithAttachments,
  access: ProjectAccess,
): Record<string, unknown> {
  const attachments = Array.isArray(project.attachments) ? project.attachments : [];
  const publicAttachments = attachments.filter(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      !Array.isArray(item) &&
      (item as Record<string, unknown>).is_private !== true,
  );

  const layer1: Record<string, unknown> = {
    id: project.id,
    slug: project.slug,
    title: project.title,
    tagline: project.tagline,
    category: project.category,
    sector_tags: project.sector_tags,
    problem_statement: project.problem_statement,
    target_market: project.target_market,
    cover_image_url: project.cover_image_url,
    images: project.images,
    video_url: project.video_url,
    estimated_cost_min: project.estimated_cost_min,
    estimated_cost_max: project.estimated_cost_max,
    implementation_months: project.implementation_months,
    selling_mode: project.selling_mode,
    fixed_price: project.fixed_price,
    auction_start_price: project.auction_start_price,
    auction_end_date: project.auction_end_date,
    currency: project.currency,
    status: project.status,
    display_level: project.display_level,
    ai_score: project.ai_score,
    ai_teaser: project.ai_teaser,
    content_hash: project.content_hash,
    submitted_at: project.submitted_at,
    similarity_status: project.similarity_status,
    views_count: project.views_count,
    saves_count: project.saves_count,
    seller_id: project.seller_id,
    created_at: project.created_at,
    attachments: publicAttachments,
    access_level: access.level,
  };

  if (!hasAtLeast(access, 'NDA')) return layer1;

  Object.assign(layer1, {
    executive_summary: project.executive_summary,
    market_size: project.market_size,
    competitive_advantage: project.competitive_advantage,
    similarity_note: project.similarity_note,
  });

  if (!hasAtLeast(access, 'OWNED')) return layer1;

  Object.assign(layer1, {
    full_description: project.full_description,
    solution_detail: project.solution_detail,
    business_model: project.business_model,
    implementation_steps: project.implementation_steps,
    resources_identified: project.resources_identified,
    projected_revenue: project.projected_revenue,
    attachments,
    ai_evaluation: project.ai_evaluation,
    similar_projects: project.similar_projects,
  });

  if (access.is_owner || access.is_admin) {
    Object.assign(layer1, { auction_reserve_price: project.auction_reserve_price });
  }

  return layer1;
}

/** Un projet est-il consultable publiquement dans son statut actuel ? */
export function isPubliclyVisible(status: ProjectStatus): boolean {
  return status === ProjectStatus.PUBLISHED || status === ProjectStatus.SOLD;
}
