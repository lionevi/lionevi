import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { draftProjectSchema } from '@/lib/validation';
import { applyAccessFilter, resolveProjectAccess } from '@/server/access';
import { getAuctionState } from '@/server/auctions';
import { deleteProject, updateProject } from '@/server/projects';
import { getSessionUser, notFound, requireUser } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/** Detail d'un projet, filtre selon le niveau d'acces de l'appelant. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project) throw notFound('Projet introuvable.');

    const user = await getSessionUser();
    const access = await resolveProjectAccess(project, user);
    const auction =
      project.selling_mode === 'AUCTION' ? await getAuctionState(project) : null;

    return ok({ project: applyAccessFilter(project, access), access, auction });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Mise a jour d'un projet (vendeur uniquement, avant publication). */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();
    const input = draftProjectSchema.parse(await readJson(request));
    const project = await updateProject(params.id, user.id, input);
    return ok({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();
    await deleteProject(params.id, user.id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
