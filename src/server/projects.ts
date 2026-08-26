import { ProjectStatus, type Prisma, type Project } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DISPLAY_LEVEL_WEIGHT } from '@/lib/scoring';
import { uniqueProjectSlug } from '@/lib/slug';
import type { DraftProjectInput, ProjectFilters, ProjectInput } from '@/lib/validation';
import { conflict, forbidden, notFound } from '@/server/session';

export const PROJECTS_PER_PAGE = 12;

export const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  category: true,
  sector_tags: true,
  cover_image_url: true,
  ai_teaser: true,
  ai_score: true,
  display_level: true,
  selling_mode: true,
  fixed_price: true,
  auction_start_price: true,
  auction_end_date: true,
  currency: true,
  status: true,
  views_count: true,
  saves_count: true,
  created_at: true,
  seller: { select: { id: true, name: true, avatar_url: true, country: true } },
  _count: { select: { bids: true } },
} satisfies Prisma.ProjectSelect;

export type ProjectCard = Prisma.ProjectGetPayload<{ select: typeof projectCardSelect }>;

/** Construit la clause `where` de la marketplace a partir des filtres. */
function buildWhere(filters: ProjectFilters): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {
    status: { in: [ProjectStatus.PUBLISHED, ProjectStatus.SOLD] },
  };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { tagline: { contains: filters.q, mode: 'insensitive' } },
      { problem_statement: { contains: filters.q, mode: 'insensitive' } },
      { target_market: { contains: filters.q, mode: 'insensitive' } },
      { sector_tags: { has: filters.q } },
    ];
  }
  if (filters.categorie) where.category = filters.categorie;
  if (filters.mode) where.selling_mode = filters.mode;
  if (filters.niveau) where.display_level = filters.niveau;

  if (filters.prix_min !== undefined || filters.prix_max !== undefined) {
    const range: Prisma.FloatNullableFilter = {};
    if (filters.prix_min !== undefined) range.gte = filters.prix_min;
    if (filters.prix_max !== undefined) range.lte = filters.prix_max;
    where.OR = [
      ...(where.OR ?? []),
      { selling_mode: 'FIXED_PRICE', fixed_price: range },
      { selling_mode: 'AUCTION', auction_start_price: range },
    ];
  }

  return where;
}

function buildOrderBy(sort: ProjectFilters['tri']): Prisma.ProjectOrderByWithRelationInput[] {
  switch (sort) {
    case 'recent':
      return [{ created_at: 'desc' }];
    case 'prix_asc':
      return [{ fixed_price: 'asc' }, { auction_start_price: 'asc' }];
    case 'prix_desc':
      return [{ fixed_price: 'desc' }, { auction_start_price: 'desc' }];
    case 'populaire':
      return [{ views_count: 'desc' }, { saves_count: 'desc' }];
    case 'score':
    default:
      return [{ ai_score: 'desc' }, { created_at: 'desc' }];
  }
}

export interface ProjectListResult {
  projects: ProjectCard[];
  total: number;
  page: number;
  pages: number;
}

/** Liste paginee et filtree des projets publies. */
export async function listProjects(filters: ProjectFilters): Promise<ProjectListResult> {
  const where = buildWhere(filters);
  const page = Math.max(1, filters.page);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: projectCardSelect,
      orderBy: buildOrderBy(filters.tri),
      skip: (page - 1) * PROJECTS_PER_PAGE,
      take: PROJECTS_PER_PAGE,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PROJECTS_PER_PAGE)),
  };
}

/** Projets mis en avant sur la page d'accueil (Premium et Featured d'abord). */
export async function listFeaturedProjects(limit = 6): Promise<ProjectCard[]> {
  const projects = await prisma.project.findMany({
    where: { status: ProjectStatus.PUBLISHED },
    select: projectCardSelect,
    orderBy: [{ ai_score: 'desc' }, { views_count: 'desc' }],
    take: limit * 2,
  });

  return projects
    .sort((a, b) => {
      const weightA = a.display_level ? DISPLAY_LEVEL_WEIGHT[a.display_level] : 0;
      const weightB = b.display_level ? DISPLAY_LEVEL_WEIGHT[b.display_level] : 0;
      if (weightA !== weightB) return weightB - weightA;
      return (b.ai_score ?? 0) - (a.ai_score ?? 0);
    })
    .slice(0, limit);
}

/** Encheres en cours, triees par date de fin la plus proche. */
export async function listActiveAuctions(limit = 4): Promise<ProjectCard[]> {
  return prisma.project.findMany({
    where: {
      status: ProjectStatus.PUBLISHED,
      selling_mode: 'AUCTION',
      auction_end_date: { gt: new Date() },
    },
    select: projectCardSelect,
    orderBy: { auction_end_date: 'asc' },
    take: limit,
  });
}

export const projectDetailInclude = {
  seller: {
    select: {
      id: true,
      name: true,
      avatar_url: true,
      country: true,
      bio: true,
      created_at: true,
      reviews_received: { select: { rating: true } },
    },
  },
  bids: {
    orderBy: { amount: 'desc' },
    take: 10,
    include: { bidder: { select: { id: true, name: true, avatar_url: true } } },
  },
  transaction: { select: { id: true, buyer_id: true, status: true, created_at: true } },
  _count: { select: { bids: true, saved_by: true, nda_agreements: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectDetail = Prisma.ProjectGetPayload<{ include: typeof projectDetailInclude }>;

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  return prisma.project.findUnique({ where: { slug }, include: projectDetailInclude });
}

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  return prisma.project.findUnique({ where: { id }, include: projectDetailInclude });
}

/** Incremente le compteur de vues sans faire echouer l'affichage en cas d'erreur. */
export async function incrementViews(projectId: string): Promise<void> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { views_count: { increment: 1 } },
    });
  } catch (error) {
    console.error('[projects] echec de l increment des vues :', error);
  }
}

function toProjectData(input: ProjectInput | DraftProjectInput): Prisma.ProjectUncheckedUpdateInput {
  return {
    title: input.title,
    tagline: input.tagline,
    category: input.category,
    sector_tags: input.sector_tags ?? [],
    problem_statement: input.problem_statement,
    target_market: input.target_market,
    cover_image_url: input.cover_image_url ?? null,
    executive_summary: input.executive_summary ?? null,
    market_size: input.market_size ?? null,
    competitive_advantage: input.competitive_advantage ?? null,
    full_description: input.full_description ?? null,
    solution_detail: input.solution_detail ?? null,
    business_model: input.business_model ?? null,
    implementation_steps: input.implementation_steps ?? [],
    resources_identified: input.resources_identified ?? null,
    images: input.images ?? [],
    attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue[],
    video_url: input.video_url ?? null,
    estimated_cost_min: input.estimated_cost_min ?? null,
    estimated_cost_max: input.estimated_cost_max ?? null,
    implementation_months: input.implementation_months ?? null,
    projected_revenue: input.projected_revenue ?? null,
    selling_mode: input.selling_mode ?? 'FIXED_PRICE',
    fixed_price: input.fixed_price ?? null,
    auction_start_price: input.auction_start_price ?? null,
    auction_reserve_price: input.auction_reserve_price ?? null,
    auction_end_date: input.auction_end_date ?? null,
    currency: input.currency ?? 'XOF',
    similarity_note: input.similarity_note ?? null,
  };
}

/** Cree un brouillon de projet. */
export async function createDraft(sellerId: string, input: DraftProjectInput): Promise<Project> {
  const slug = await uniqueProjectSlug(input.title);
  const data = toProjectData(input);

  return prisma.project.create({
    data: {
      ...(data as Prisma.ProjectUncheckedCreateInput),
      slug,
      seller_id: sellerId,
      status: ProjectStatus.DRAFT,
      title: input.title,
      tagline: input.tagline ?? '',
      category: input.category,
      problem_statement: input.problem_statement ?? '',
      target_market: input.target_market ?? '',
      selling_mode: input.selling_mode ?? 'FIXED_PRICE',
    },
  });
}

/** Etats depuis lesquels un vendeur peut encore modifier son projet. */
const EDITABLE_STATUSES: ProjectStatus[] = [
  ProjectStatus.DRAFT,
  ProjectStatus.REJECTED,
  ProjectStatus.PENDING_REVIEW,
];

export async function updateProject(
  projectId: string,
  sellerId: string,
  input: ProjectInput | DraftProjectInput,
): Promise<Project> {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, seller_id: true, status: true, title: true, slug: true },
  });

  if (!existing) throw notFound('Projet introuvable.');
  if (existing.seller_id !== sellerId) throw forbidden("Ce projet ne vous appartient pas.");
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    throw conflict('Un projet publie ou vendu ne peut plus etre modifie.');
  }

  const slug =
    input.title && input.title !== existing.title
      ? await uniqueProjectSlug(input.title, existing.id)
      : existing.slug;

  return prisma.project.update({
    where: { id: projectId },
    data: { ...toProjectData(input), slug },
  });
}

export async function deleteProject(projectId: string, sellerId: string): Promise<void> {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { seller_id: true, status: true, _count: { select: { bids: true } } },
  });

  if (!existing) throw notFound('Projet introuvable.');
  if (existing.seller_id !== sellerId) throw forbidden("Ce projet ne vous appartient pas.");
  if (existing.status === ProjectStatus.SOLD) throw conflict('Un projet vendu ne peut pas etre supprime.');
  if (existing._count.bids > 0) {
    throw conflict('Ce projet a recu des encheres : archivez-le plutot que de le supprimer.');
  }

  await prisma.project.delete({ where: { id: projectId } });
}

export async function archiveProject(projectId: string, sellerId: string): Promise<Project> {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { seller_id: true, status: true },
  });

  if (!existing) throw notFound('Projet introuvable.');
  if (existing.seller_id !== sellerId) throw forbidden("Ce projet ne vous appartient pas.");
  if (existing.status === ProjectStatus.SOLD) throw conflict('Un projet vendu ne peut pas etre archive.');

  return prisma.project.update({
    where: { id: projectId },
    data: { status: ProjectStatus.ARCHIVED },
  });
}

/** Projets d'un vendeur, tous statuts confondus. */
export async function listSellerProjects(sellerId: string): Promise<
  Array<
    ProjectCard & {
      similarity_status: Project['similarity_status'];
      submitted_at: Date | null;
      content_hash: string | null;
    }
  >
> {
  return prisma.project.findMany({
    where: { seller_id: sellerId },
    select: {
      ...projectCardSelect,
      similarity_status: true,
      submitted_at: true,
      content_hash: true,
    },
    orderBy: { updated_at: 'desc' },
  });
}

/** Bascule l'enregistrement d'un projet dans les favoris. */
export async function toggleSavedProject(
  userId: string,
  projectId: string,
): Promise<{ saved: boolean }> {
  const existing = await prisma.savedProject.findUnique({
    where: { user_id_project_id: { user_id: userId, project_id: projectId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.savedProject.delete({
        where: { user_id_project_id: { user_id: userId, project_id: projectId } },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { saves_count: { decrement: 1 } },
      }),
    ]);
    return { saved: false };
  }

  await prisma.$transaction([
    prisma.savedProject.create({ data: { user_id: userId, project_id: projectId } }),
    prisma.project.update({ where: { id: projectId }, data: { saves_count: { increment: 1 } } }),
  ]);
  return { saved: true };
}
