import { randomUUID } from 'node:crypto';
import type { PaymentMethod } from '@prisma/client';
import { env } from '@/lib/env';
import { PaymentError } from '@/lib/payments/stripe';

/**
 * Integrations Mobile Money — implementations de substitution (stubs).
 *
 * Chaque operateur expose une API differente (Wave Checkout API, Orange Money
 * Web Payment, MTN MoMo Collections). Le contrat ci-dessous est volontairement
 * commun : brancher un operateur reel consiste a remplacer le corps de
 * `initiate` et `verify` par les appels HTTP correspondants, sans toucher au
 * reste de l'application.
 */

export type MobileMoneyMethod = Extract<
  PaymentMethod,
  'WAVE' | 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY'
>;

export interface MobileMoneyProvider {
  method: MobileMoneyMethod;
  label: string;
  countries: string[];
  /** Prefixe de reference operateur, utile en rapprochement comptable. */
  referencePrefix: string;
  isConfigured: () => boolean;
}

export const MOBILE_MONEY_PROVIDERS: Record<MobileMoneyMethod, MobileMoneyProvider> = {
  WAVE: {
    method: 'WAVE',
    label: 'Wave',
    countries: ['SN', 'CI', 'BF', 'ML'],
    referencePrefix: 'WV',
    isConfigured: () => Boolean(env.WAVE_API_KEY),
  },
  ORANGE_MONEY: {
    method: 'ORANGE_MONEY',
    label: 'Orange Money',
    countries: ['SN', 'CI', 'ML', 'BF', 'NE', 'GN', 'CM'],
    referencePrefix: 'OM',
    isConfigured: () => Boolean(env.ORANGE_MONEY_API_KEY),
  },
  MTN_MOBILE_MONEY: {
    method: 'MTN_MOBILE_MONEY',
    label: 'MTN Mobile Money',
    countries: ['BJ', 'CI', 'GN', 'CM', 'NE'],
    referencePrefix: 'MTN',
    isConfigured: () => Boolean(env.MTN_MOMO_API_KEY),
  },
};

export interface MobileMoneyRequest {
  method: MobileMoneyMethod;
  amount: number;
  currency: string;
  phone: string;
  projectId: string;
  buyerId: string;
}

export interface MobileMoneyResult {
  reference: string;
  status: 'PENDING';
  instructions: string;
  /** URL de redirection operateur (null tant que l'integration reelle n'est pas branchee). */
  redirect_url: string | null;
}

/** Normalise un numero au format international sans espaces. */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!/^\+?\d{8,15}$/.test(cleaned)) {
    throw new PaymentError('Numero de telephone invalide.', 'INVALID_STATE');
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Declenche une demande de paiement Mobile Money.
 *
 * STUB : aucune requete reseau n'est emise. La demande est enregistree comme
 * PENDING et devra etre confirmee par le webhook operateur
 * (`/api/webhooks/mobile-money`) une fois l'integration branchee.
 */
export async function initiateMobileMoneyPayment(
  request: MobileMoneyRequest,
): Promise<MobileMoneyResult> {
  const provider = MOBILE_MONEY_PROVIDERS[request.method];
  const phone = normalizePhone(request.phone);

  if (request.amount <= 0) {
    throw new PaymentError('Montant invalide.', 'INVALID_STATE');
  }

  const reference = `${provider.referencePrefix}-${randomUUID().slice(0, 12).toUpperCase()}`;

  if (!provider.isConfigured()) {
    console.warn(
      `[mobile-money] ${provider.label} non configure — demande ${reference} enregistree en mode simulation.`,
    );
  }

  return {
    reference,
    status: 'PENDING',
    instructions: `Une demande de paiement de ${request.amount} ${request.currency} a ete envoyee au ${phone} via ${provider.label}. Validez-la depuis votre telephone pour finaliser l'achat.`,
    redirect_url: null,
  };
}

/**
 * Verifie l'etat d'une demande Mobile Money.
 *
 * STUB : renvoie toujours PENDING. L'implementation reelle interroge l'API de
 * l'operateur (ou s'appuie sur son webhook) pour confirmer l'encaissement.
 */
export async function verifyMobileMoneyPayment(
  method: MobileMoneyMethod,
  reference: string,
): Promise<{ status: 'PENDING' | 'COMPLETED' | 'FAILED'; reference: string }> {
  const provider = MOBILE_MONEY_PROVIDERS[method];
  if (!provider.isConfigured()) {
    return { status: 'PENDING', reference };
  }
  console.warn(`[mobile-money] verification ${provider.label} non implementee pour ${reference}.`);
  return { status: 'PENDING', reference };
}

/** Moyens de paiement Mobile Money pertinents pour un pays donne. */
export function providersForCountry(country: string): MobileMoneyProvider[] {
  return Object.values(MOBILE_MONEY_PROVIDERS).filter((provider) =>
    provider.countries.includes(country.toUpperCase()),
  );
}
