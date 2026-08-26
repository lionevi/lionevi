import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { reviewSchema } from '@/lib/validation';
import { conflict, forbidden, notFound, requireUser } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/** Depot d'un avis sur une transaction finalisee. */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();
    const input = reviewSchema.parse({
      ...(await readJson(request) as object),
      transaction_id: params.id,
    });

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { review: { select: { id: true } } },
    });

    if (!transaction) throw notFound('Transaction introuvable.');
    if (transaction.status !== 'COMPLETED') {
      throw conflict('Seule une transaction finalisee peut etre evaluee.');
    }
    if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
      throw forbidden("Cette transaction ne concerne pas votre compte.");
    }
    if (transaction.review) throw conflict('Un avis a deja ete depose sur cette transaction.');

    const reviewedId =
      transaction.buyer_id === user.id ? transaction.seller_id : transaction.buyer_id;

    const review = await prisma.review.create({
      data: {
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        transaction_id: transaction.id,
        rating: input.rating,
        comment: input.comment ?? null,
      },
    });

    return ok({ review }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
