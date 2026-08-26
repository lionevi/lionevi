import type { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { closeExpiredAuctions } from '@/server/auctions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cloture des encheres arrivees a echeance.
 * A declencher par un cron Vercel (`vercel.json`) avec l'en-tete
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (env.CRON_SECRET) {
    const provided = request.headers.get('authorization');
    if (provided !== `Bearer ${env.CRON_SECRET}`) {
      return new Response('Non autorise.', { status: 401 });
    }
  }

  try {
    const closures = await closeExpiredAuctions();
    return ok({ closed: closures.length, closures });
  } catch (error) {
    return handleApiError(error);
  }
}
