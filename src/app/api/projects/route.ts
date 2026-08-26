import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { draftProjectSchema, projectFiltersSchema } from '@/lib/validation';
import { createDraft, listProjects } from '@/server/projects';
import { requireUser } from '@/server/session';

/** Liste publique et filtree des projets. */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const filters = projectFiltersSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    return ok(await listProjects(filters));
  } catch (error) {
    return handleApiError(error);
  }
}

/** Creation d'un brouillon de projet. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const input = draftProjectSchema.parse(await readJson(request));
    const project = await createDraft(user.id, input);
    return ok({ project }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
