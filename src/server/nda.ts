import { ProjectStatus, type NDAgreement } from '@prisma/client';
import { APP_NAME } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { conflict, forbidden, notFound } from '@/server/session';

/** Texte de l'accord de confidentialite presente avant la couche 2. */
export const NDA_TEXT = `En signant cet accord de confidentialite, je m'engage a :

1. Ne pas divulguer, publier ni transmettre a un tiers les informations confidentielles auxquelles j'accede sur cette page (resume executif, taille de marche, avantage concurrentiel) ;
2. N'utiliser ces informations que pour evaluer l'opportunite d'acquerir ce projet ;
3. Ne pas exploiter, reproduire ni adapter tout ou partie de ce projet sans en avoir acquis les droits ;
4. Reconnaitre que le depot du projet sur ${APP_NAME} est horodate et associe a une empreinte SHA-256 opposable en cas de litige.

Cet engagement prend effet a la signature et reste valable cinq (5) ans. Ma signature electronique est constituee de mon identifiant de compte, de mon adresse IP et de l'horodatage de l'acceptation, enregistres par la plateforme.`;

export interface SignNdaInput {
  userId: string;
  projectId: string;
  ipAddress: string;
  userAgent: string;
}

/** Signe le NDA d'un projet (idempotent : une signature par utilisateur et projet). */
export async function signNda(input: SignNdaInput): Promise<NDAgreement> {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true, seller_id: true, status: true },
  });

  if (!project) throw notFound('Projet introuvable.');
  if (project.seller_id === input.userId) {
    throw conflict("Vous etes le vendeur de ce projet : le NDA ne s'applique pas.");
  }
  if (project.status !== ProjectStatus.PUBLISHED && project.status !== ProjectStatus.SOLD) {
    throw forbidden("Ce projet n'est pas consultable.");
  }

  const existing = await prisma.nDAgreement.findUnique({
    where: { user_id_project_id: { user_id: input.userId, project_id: input.projectId } },
  });
  if (existing) return existing;

  return prisma.nDAgreement.create({
    data: {
      user_id: input.userId,
      project_id: input.projectId,
      ip_address: input.ipAddress,
      user_agent: input.userAgent.slice(0, 400),
    },
  });
}

export async function hasSignedNda(userId: string, projectId: string): Promise<boolean> {
  const nda = await prisma.nDAgreement.findUnique({
    where: { user_id_project_id: { user_id: userId, project_id: projectId } },
    select: { id: true },
  });
  return nda !== null;
}

/** Signatures recues sur les projets d'un vendeur (preuve d'interet). */
export async function listNdaSignatories(sellerId: string): Promise<
  Array<{
    project_title: string;
    project_slug: string;
    user_name: string;
    signed_at: Date;
  }>
> {
  const agreements = await prisma.nDAgreement.findMany({
    where: { project: { seller_id: sellerId } },
    include: {
      project: { select: { title: true, slug: true } },
      user: { select: { name: true } },
    },
    orderBy: { signed_at: 'desc' },
    take: 100,
  });

  return agreements.map((agreement) => ({
    project_title: agreement.project.title,
    project_slug: agreement.project.slug,
    user_name: agreement.user.name,
    signed_at: agreement.signed_at,
  }));
}
