import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { completeTransaction } from '@/server/transactions';

export const runtime = 'nodejs';

/**
 * Webhook Mobile Money (Wave, Orange Money, MTN MoMo).
 *
 * STUB : le format de charge utile est normalise ici. Chaque operateur ayant
 * son propre schema et sa propre signature, l'adaptation se fait dans
 * `parsePayload` et `verifySignature` sans toucher au reste du flux.
 */
interface NormalizedPayload {
  reference: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
}

function parsePayload(raw: unknown): NormalizedPayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as Record<string, unknown>;

  const reference =
    typeof body.reference === 'string'
      ? body.reference
      : typeof body.transaction_id === 'string'
        ? body.transaction_id
        : null;

  const rawStatus = typeof body.status === 'string' ? body.status.toUpperCase() : null;
  if (!reference || !rawStatus) return null;

  const status =
    rawStatus === 'SUCCESS' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESSFUL'
      ? 'COMPLETED'
      : rawStatus === 'FAILED' || rawStatus === 'CANCELLED'
        ? 'FAILED'
        : 'PENDING';

  return { reference, status };
}

/** Verifie la signature HMAC-SHA256 du corps, si un secret est configure. */
function verifySignature(body: string, signature: string | null): boolean {
  const secret = env.WAVE_API_KEY ?? env.ORANGE_MONEY_API_KEY ?? env.MTN_MOMO_API_KEY;
  if (!secret) {
    console.warn('[mobile-money] aucun secret configure — signature du webhook non verifiee.');
    return true;
  }
  if (!signature) return false;

  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const received = Buffer.from(signature, 'utf8');
  const computed = Buffer.from(expected, 'utf8');
  return received.length === computed.length && timingSafeEqual(received, computed);
}

export async function POST(request: NextRequest): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');

  if (!verifySignature(rawBody, signature)) {
    return new Response('Signature invalide.', { status: 401 });
  }

  let payload: NormalizedPayload | null;
  try {
    payload = parsePayload(JSON.parse(rawBody));
  } catch {
    return new Response('Corps JSON invalide.', { status: 400 });
  }

  if (!payload) return new Response('Charge utile non reconnue.', { status: 400 });

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { stripe_id: payload.reference },
      select: { id: true, status: true },
    });

    if (!transaction) {
      console.warn(`[mobile-money] aucune transaction pour la reference ${payload.reference}`);
      return Response.json({ received: true, matched: false });
    }

    if (payload.status === 'COMPLETED' && transaction.status === 'PENDING') {
      await completeTransaction(transaction.id);
    } else if (payload.status === 'FAILED' && transaction.status === 'PENDING') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'REFUNDED' },
      });
    }

    return Response.json({ received: true, matched: true });
  } catch (error) {
    console.error('[mobile-money] echec du traitement du webhook :', error);
    return new Response('Erreur de traitement.', { status: 500 });
  }
}
