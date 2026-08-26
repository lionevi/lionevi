import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { bidSchema } from '@/lib/validation';
import { placeBid } from '@/server/auctions';
import { requireUser } from '@/server/session';

/** Depot d'une enchere. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const input = bidSchema.parse(await readJson(request));
    const result = await placeBid(input.project_id, user.id, input.amount);

    return ok(
      {
        bid: { id: result.bid.id, amount: result.bid.amount, created_at: result.bid.created_at },
        auction: result.auction,
        extended: result.extended,
        message: result.extended
          ? 'Offre enregistree. La fin de l enchere a ete prolongee de 5 minutes.'
          : 'Offre enregistree.',
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
