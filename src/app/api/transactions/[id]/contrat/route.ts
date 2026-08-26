import type { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/lib/api';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { isStorageConfigured } from '@/lib/env';
import { generateTransferContract } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';
import { createSignedUrl } from '@/lib/storage';
import { conflict, forbidden, notFound, requireUser } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/**
 * Contrat de cession d'une transaction.
 * Renvoie une URL signee si le contrat est stocke, sinon regenere le PDF a la volee.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        buyer: { select: { name: true, email: true, country: true } },
        seller: { select: { name: true, email: true, country: true } },
      },
    });

    if (!transaction) throw notFound('Transaction introuvable.');
    if (
      transaction.buyer_id !== user.id &&
      transaction.seller_id !== user.id &&
      user.role !== 'ADMIN'
    ) {
      throw forbidden("Ce contrat ne concerne pas votre compte.");
    }
    if (transaction.status === 'PENDING') {
      throw conflict("Le contrat est emis une fois le paiement encaisse.");
    }

    if (transaction.contract_url && isStorageConfigured()) {
      return ok({ url: await createSignedUrl(transaction.contract_url, 600) });
    }

    const pdf = await generateTransferContract({
      transactionId: transaction.id,
      projectTitle: transaction.project.title,
      projectSlug: transaction.project.slug,
      contentHash: transaction.project.content_hash ?? 'non disponible',
      submittedAt: transaction.project.submitted_at ?? transaction.project.created_at,
      soldAt: transaction.created_at,
      amount: transaction.amount,
      currency: transaction.project.currency,
      platformFee: transaction.platform_fee,
      sellerEarnings: transaction.seller_earnings,
      paymentMethod: PAYMENT_METHOD_LABELS[transaction.payment_method],
      seller: transaction.seller,
      buyer: transaction.buyer,
    });

    return new Response(pdf as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrat-cession-${transaction.project.slug}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
