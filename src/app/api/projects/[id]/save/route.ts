import type { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/lib/api';
import { toggleSavedProject } from '@/server/projects';
import { requireUser } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/** Ajoute ou retire un projet des favoris. */
export async function POST(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();
    return ok(await toggleSavedProject(user.id, params.id));
  } catch (error) {
    return handleApiError(error);
  }
}
