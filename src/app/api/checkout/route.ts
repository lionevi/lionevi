import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { checkoutSchema } from '@/lib/validation';
import { startCheckout } from '@/server/transactions';
import { requireUser } from '@/server/session';

/** Ouvre une transaction et declenche le paiement selon le moyen choisi. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const input = checkoutSchema.parse(await readJson(request));

    const result = await startCheckout({
      projectId: input.project_id,
      buyerId: user.id,
      paymentMethod: input.payment_method,
      phone: input.phone,
    });

    return ok(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
