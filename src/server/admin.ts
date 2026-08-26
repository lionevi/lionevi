import { NotificationType, ProjectStatus, type Prisma } from '@prisma/client';
import { sendProjectPublishedEmail, sendProjectRejectedEmail } from '@/lib/email';
import { notify } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { conflict, notFound } from '@/server/session';

export interface PlatformStats {
  users: number;
  projects_published: number;
  projects_pending: number;
  transactions_completed: number;
  gross_volume: number;
  platform_revenue: number;
  active_auctions: number;
  blocked_messages: number;
}

/** Indicateurs de la plateforme pour le tableau de bord administrateur. */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    users,
    published,
    pending,
    completed,
    volume,
    activeAuctions,
    blockedMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count({ where: { status: ProjectStatus.PUBLISHED } }),
    prisma.project.count({
      where: { status: { in: [ProjectStatus.PENDING_REVIEW, ProjectStatus.SIMILARITY_CHECK] } },
    }),
    prisma.transaction.count({ where: { status: 'COMPLETED' } }),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true, platform_fee: true },
    }),
    prisma.project.count({
      where: {
        status: ProjectStatus.PUBLISHED,
        selling_mode: 'AUCTION',
        auction_end_date: { gt: new Date() },
      },
    }),
    prisma.message.count({ where: { is_blocked: true } }),
  ]);

  return {
    users,
    projects_published: published,
    projects_pending: pending,
    transactions_completed: completed,
    gross_volume: volume._sum.amount ?? 0,
    platform_revenue: volume._sum.platform_fee ?? 0,
    active_auctions: activeAuctions,
    blocked_messages: blockedMessages,
  };
}

export const moderationQueueSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  category: true,
  status: true,
  ai_score: true,
  display_level: true,
  similarity_status: true,
  similar_projects: true,
  similarity_note: true,
  content_hash: true,
  submitted_at: true,
  created_at: true,
  seller: { select: { id: true, name: true, email: true, country: true } },
} satisfies Prisma.ProjectSelect;

export type ModerationItem = Prisma.ProjectGetPayload<{ select: typeof moderationQueueSelect }>;

/** Projets en attente de decision humaine. */
export async function listModerationQueue(): Promise<ModerationItem[]> {
  return prisma.project.findMany({
    where: {
      status: { in: [ProjectStatus.PENDING_REVIEW, ProjectStatus.SIMILARITY_CHECK] },
    },
    select: moderationQueueSelect,
    orderBy: { submitted_at: 'asc' },
  });
}

/** Decision de moderation : publication ou refus motive. */
export async function reviewProject(
  projectId: string,
  decision: 'APPROVE' | 'REJECT',
  reason?: string,
): Promise<{ status: ProjectStatus }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { seller: { select: { id: true, email: true } } },
  });

  if (!project) throw notFound('Projet introuvable.');
  if (project.status === ProjectStatus.SOLD) throw conflict('Ce projet est deja vendu.');

  if (decision === 'APPROVE') {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.PUBLISHED },
    });

    await notify({
      userId: project.seller_id,
      type: NotificationType.PROJECT_PUBLISHED,
      title: 'Projet approuve',
      body: `"${project.title}" a ete valide par notre equipe et est desormais en ligne.`,
      link: `/projets/${project.slug}`,
    });
    await sendProjectPublishedEmail(
      project.seller.email,
      project.title,
      project.slug,
      project.ai_score ?? 0,
    );

    return { status: ProjectStatus.PUBLISHED };
  }

  const motif = reason?.trim() || "Le dossier ne respecte pas les conditions de publication.";

  await prisma.project.update({
    where: { id: projectId },
    data: { status: ProjectStatus.REJECTED },
  });

  await notify({
    userId: project.seller_id,
    type: NotificationType.PROJECT_REJECTED,
    title: 'Projet refuse',
    body: motif,
    link: '/tableau-de-bord/projets',
  });
  await sendProjectRejectedEmail(project.seller.email, project.title, motif);

  return { status: ProjectStatus.REJECTED };
}

/** Suspend ou reactive un compte. */
export async function setUserBanned(userId: string, banned: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { is_banned: banned } });
}

/** Messages bloques par la moderation, pour controle humain. */
export async function listBlockedMessages(limit = 50) {
  return prisma.message.findMany({
    where: { is_blocked: true },
    orderBy: { created_at: 'desc' },
    take: limit,
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true } },
    },
  });
}
