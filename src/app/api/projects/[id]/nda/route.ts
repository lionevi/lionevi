import type { NextRequest } from 'next/server';
import { clientIp, handleApiError, ok, readJson } from '@/lib/api';
import { ndaSchema } from '@/lib/validation';
import { signNda } from '@/server/nda';
import { requireUser } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/** Signature electronique de l'accord de confidentialite (deblocage couche 2). */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();
    ndaSchema.parse({ ...(await readJson(request) as object), project_id: params.id });

    const agreement = await signNda({
      userId: user.id,
      projectId: params.id,
      ipAddress: clientIp(request),
      userAgent: request.headers.get('user-agent') ?? 'inconnu',
    });

    return ok({ signed_at: agreement.signed_at, message: 'Accord signe. Le resume executif est debloque.' });
  } catch (error) {
    return handleApiError(error);
  }
}
