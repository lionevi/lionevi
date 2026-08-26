import { env } from '@/lib/env';
import { DEFAULT_PLATFORM_FEE_PERCENT } from '@/lib/constants';

export interface FeeBreakdown {
  amount: number;
  platform_fee: number;
  seller_earnings: number;
  fee_percent: number;
}

/** Repartition du prix de vente entre la plateforme et le vendeur. */
export function computeFees(amount: number, currency = 'XOF'): FeeBreakdown {
  const feePercent = env.PLATFORM_FEE_PERCENT ?? DEFAULT_PLATFORM_FEE_PERCENT;
  const zeroDecimal = ['XOF', 'XAF', 'GNF'].includes(currency);
  const round = (value: number): number =>
    zeroDecimal ? Math.round(value) : Math.round(value * 100) / 100;

  const platformFee = round((amount * feePercent) / 100);
  return {
    amount: round(amount),
    platform_fee: platformFee,
    seller_earnings: round(amount - platformFee),
    fee_percent: feePercent,
  };
}

/** Stripe raisonne en plus petite unite : XOF/XAF/GNF n'ont pas de decimales. */
export function toStripeAmount(amount: number, currency: string): number {
  const zeroDecimal = ['XOF', 'XAF', 'GNF', 'JPY'].includes(currency.toUpperCase());
  return zeroDecimal ? Math.round(amount) : Math.round(amount * 100);
}
