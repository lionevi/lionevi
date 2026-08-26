import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { adminReviewSchema } from '@/lib/validation';
import { reviewProject } from '@/server/admin';
import { requireAdmin } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/** Decision de moderation sur un projet en attente. */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    await requireAdmin();
    const input = adminReviewSchema.parse({
      ...(await readJson(request) as object),
      project_id: params.id,
    });

    const result = await reviewProject(params.id, input.decision, input.reason);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
