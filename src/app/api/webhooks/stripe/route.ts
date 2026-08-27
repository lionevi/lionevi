import type Stripe from 'stripe';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStripeConfigured, isStripeWebhookConfigured } from '@/lib/env';
import { constructWebhookEvent } from '@/lib/payments/stripe';
import { completeTransaction } from '@/server/transactions';

export const runtime = 'nodejs';

/**
 * Webhook Stripe.
 *
 * La signature est verifiee avant tout traitement. Le corps brut est requis :
 * il ne doit surtout pas etre parse en JSON avant la verification.
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Stripe volontairement desactive : on repond proprement plutot que de
  // laisser croire a une signature invalide.
  if (!isStripeConfigured() || !isStripeWebhookConfigured()) {
    return new Response('Paiement par carte desactive sur cette instance.', { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Signature Stripe manquante.', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(await request.text(), signature);
  } catch (error) {
    console.error('[stripe] signature invalide :', error);
    return new Response('Signature invalide.', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const transaction = await prisma.transaction.findFirst({
          where: { stripe_id: session.id },
          select: { id: true },
        });
        if (transaction) {
          await completeTransaction(transaction.id);
        } else {
          console.warn(`[stripe] aucune transaction pour la session ${session.id}`);
        }
        break;
      }

      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        const object = event.data.object as { id: string };
        await prisma.transaction.updateMany({
          where: { stripe_id: object.id, status: 'PENDING' },
          data: { status: 'REFUNDED' },
        });
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    // Une erreur 500 declenche une nouvelle tentative cote Stripe.
    console.error('[stripe] echec du traitement du webhook :', error);
    return new Response('Erreur de traitement.', { status: 500 });
  }
}
