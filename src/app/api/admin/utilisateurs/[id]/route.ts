import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { setUserBanned } from '@/server/admin';
import { requireAdmin } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/** Suspension ou reactivation d'un compte. */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    await requireAdmin();
    const body = (await readJson(request)) as { banned?: boolean };
    await setUserBanned(params.id, body.banned === true);
    return ok({ id: params.id, banned: body.banned === true });
  } catch (error) {
    return handleApiError(error);
  }
}
