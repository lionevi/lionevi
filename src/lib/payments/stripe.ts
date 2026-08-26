import Stripe from 'stripe';
import { env, isStripeConfigured, publicEnv } from '@/lib/env';
import { toStripeAmount } from '@/lib/payments/fees';

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!cachedStripe) {
    cachedStripe = new Stripe(env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return cachedStripe;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_CONFIGURED'
      | 'PROVIDER_ERROR'
      | 'INVALID_STATE'
      | 'INSUFFICIENT_FUNDS' = 'PROVIDER_ERROR',
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export interface StripeCheckoutInput {
  projectId: string;
  projectTitle: string;
  projectSlug: string;
  amount: number;
  currency: string;
  buyerId: string;
  buyerEmail: string;
}

/** Cree une session Stripe Checkout et renvoie l'URL de paiement. */
export async function createCheckoutSession(
  input: StripeCheckoutInput,
): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();
  if (!stripe) throw new PaymentError('Le paiement par carte est indisponible.', 'NOT_CONFIGURED');

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.buyerEmail,
      client_reference_id: input.projectId,
      metadata: {
        project_id: input.projectId,
        buyer_id: input.buyerId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: toStripeAmount(input.amount, input.currency),
            product_data: {
              name: input.projectTitle,
              description: "Cession de droits sur un dossier de projet IdeaMarket Africa",
            },
          },
        },
      ],
      success_url: `${baseUrl}/projets/${input.projectSlug}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/projets/${input.projectSlug}/paiement?annule=1`,
    });

    if (!session.url) throw new PaymentError('Stripe n a pas renvoye d URL de paiement.');
    return { url: session.url, sessionId: session.id };
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    const message = error instanceof Error ? error.message : 'Erreur Stripe inconnue.';
    throw new PaymentError(`Echec de la creation du paiement : ${message}`);
  }
}

/** Verifie la signature d'un webhook Stripe. */
export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    throw new PaymentError('Webhook Stripe non configure.', 'NOT_CONFIGURED');
  }
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}
