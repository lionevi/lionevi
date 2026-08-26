import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { withdrawalSchema } from '@/lib/validation';
import { requestWithdrawal } from '@/server/transactions';
import { requireUser } from '@/server/session';

/** Demande de retrait du solde vers un compte Mobile Money. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const input = withdrawalSchema.parse(await readJson(request));

    const result = await requestWithdrawal(user.id, input.amount, input.method, input.phone);

    return ok({
      ...result,
      message: 'Demande de retrait enregistree. Le versement intervient sous 48 heures ouvrees.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
