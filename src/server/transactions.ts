import {
  NotificationType,
  PaymentMethod,
  ProjectStatus,
  SellingMode,
  TransactionStatus,
  type Transaction,
} from '@prisma/client';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { sendPurchaseEmail, sendSaleEmail } from '@/lib/email';
import { notify } from '@/lib/notifications';
import { computeFees } from '@/lib/payments/fees';
import {
  initiateMobileMoneyPayment,
  type MobileMoneyMethod,
} from '@/lib/payments/mobile-money';
import { createCheckoutSession, PaymentError } from '@/lib/payments/stripe';
import { generateTransferContract } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';
import { isStorageConfigured } from '@/lib/env';
import { uploadGeneratedPdf } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { getWinningAmount } from '@/server/auctions';
import { conflict, forbidden, notFound } from '@/server/session';

export interface CheckoutResult {
  transaction_id: string;
  status: TransactionStatus;
  /** Etape suivante attendue cote client. */
  next_action: 'REDIRECT' | 'CONFIRM_ON_PHONE' | 'DONE';
  redirect_url: string | null;
  message: string;
}

/** Prix du au titre d'un projet, selon son mode de vente. */
export async function resolvePurchasePrice(projectId: string, buyerId: string): Promise<number> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { selling_mode: true, fixed_price: true, status: true },
  });
  if (!project) throw notFound('Projet introuvable.');

  if (project.selling_mode === SellingMode.FIXED_PRICE) {
    if (project.fixed_price === null) throw conflict("Ce projet n'a pas de prix defini.");
    return project.fixed_price;
  }

  const winning = await getWinningAmount(projectId, buyerId);
  if (winning === null) {
    throw forbidden("Seul le gagnant de l'enchere peut proceder au paiement.");
  }
  return winning;
}

/**
 * Ouvre une transaction et declenche le paiement.
 *
 * La transaction est creee en PENDING avant tout appel au prestataire : elle
 * sert de verrou (un projet ne peut avoir qu'une transaction, cf. contrainte
 * `project_id @unique`) et de trace en cas d'echec du prestataire.
 */
export async function startCheckout(input: {
  projectId: string;
  buyerId: string;
  paymentMethod: PaymentMethod;
  phone?: string;
}): Promise<CheckoutResult> {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    include: { seller: { select: { id: true, email: true, name: true } } },
  });

  if (!project) throw notFound('Projet introuvable.');
  if (project.seller_id === input.buyerId) {
    throw forbidden('Vous ne pouvez pas acheter votre propre projet.');
  }
  if (project.status === ProjectStatus.SOLD) throw conflict('Ce projet est deja vendu.');
  if (project.status !== ProjectStatus.PUBLISHED) throw conflict("Ce projet n'est pas en vente.");

  const amount = await resolvePurchasePrice(project.id, input.buyerId);
  const fees = computeFees(amount, project.currency);

  const existing = await prisma.transaction.findUnique({ where: { project_id: project.id } });
  if (existing && existing.status === TransactionStatus.COMPLETED) {
    throw conflict('Ce projet est deja vendu.');
  }
  if (existing && existing.buyer_id !== input.buyerId) {
    throw conflict("Une transaction est deja en cours sur ce projet.");
  }

  const buyer = await prisma.user.findUnique({
    where: { id: input.buyerId },
    select: { id: true, email: true, name: true, wallet_balance: true, country: true },
  });
  if (!buyer) throw notFound('Acheteur introuvable.');

  const transaction = existing
    ? await prisma.transaction.update({
        where: { id: existing.id },
        data: {
          amount: fees.amount,
          platform_fee: fees.platform_fee,
          seller_earnings: fees.seller_earnings,
          payment_method: input.paymentMethod,
          status: TransactionStatus.PENDING,
        },
      })
    : await prisma.transaction.create({
        data: {
          project_id: project.id,
          buyer_id: input.buyerId,
          seller_id: project.seller_id,
          amount: fees.amount,
          platform_fee: fees.platform_fee,
          seller_earnings: fees.seller_earnings,
          payment_method: input.paymentMethod,
          status: TransactionStatus.PENDING,
        },
      });

  switch (input.paymentMethod) {
    case PaymentMethod.WALLET: {
      if (buyer.wallet_balance < fees.amount) {
        throw new PaymentError(
          `Solde insuffisant : ${formatCurrency(buyer.wallet_balance, project.currency)} disponible sur ${formatCurrency(fees.amount, project.currency)} requis.`,
          'INSUFFICIENT_FUNDS',
        );
      }
      await prisma.user.update({
        where: { id: buyer.id },
        data: { wallet_balance: { decrement: fees.amount } },
      });
      await completeTransaction(transaction.id);
      return {
        transaction_id: transaction.id,
        status: TransactionStatus.COMPLETED,
        next_action: 'DONE',
        redirect_url: `/projets/${project.slug}`,
        message: 'Paiement effectue depuis votre portefeuille. Le dossier complet est debloque.',
      };
    }

    case PaymentMethod.STRIPE: {
      const session = await createCheckoutSession({
        projectId: project.id,
        projectTitle: project.title,
        projectSlug: project.slug,
        amount: fees.amount,
        currency: project.currency,
        buyerId: buyer.id,
        buyerEmail: buyer.email,
      });
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { stripe_id: session.sessionId },
      });
      return {
        transaction_id: transaction.id,
        status: TransactionStatus.PENDING,
        next_action: 'REDIRECT',
        redirect_url: session.url,
        message: 'Redirection vers le paiement securise.',
      };
    }

    case PaymentMethod.WAVE:
    case PaymentMethod.ORANGE_MONEY:
    case PaymentMethod.MTN_MOBILE_MONEY: {
      if (!input.phone) {
        throw new PaymentError(
          'Un numero de telephone est requis pour le paiement Mobile Money.',
          'INVALID_STATE',
        );
      }
      const momo = await initiateMobileMoneyPayment({
        method: input.paymentMethod as MobileMoneyMethod,
        amount: fees.amount,
        currency: project.currency,
        phone: input.phone,
        projectId: project.id,
        buyerId: buyer.id,
      });
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { stripe_id: momo.reference },
      });
      return {
        transaction_id: transaction.id,
        status: TransactionStatus.PENDING,
        next_action: 'CONFIRM_ON_PHONE',
        redirect_url: momo.redirect_url,
        message: momo.instructions,
      };
    }

    default:
      throw new PaymentError('Moyen de paiement non pris en charge.', 'INVALID_STATE');
  }
}

/**
 * Finalise une transaction encaissee :
 * marque le projet vendu, credite le vendeur, genere le contrat de cession,
 * notifie les deux parties.
 *
 * Idempotente : une transaction deja COMPLETED est renvoyee telle quelle.
 */
export async function completeTransaction(transactionId: string): Promise<Transaction> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      project: true,
      buyer: { select: { id: true, name: true, email: true, country: true } },
      seller: { select: { id: true, name: true, email: true, country: true } },
    },
  });

  if (!transaction) throw notFound('Transaction introuvable.');
  if (transaction.status === TransactionStatus.COMPLETED) return transaction;

  const completed = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.COMPLETED },
    });

    await tx.project.update({
      where: { id: transaction.project_id },
      data: { status: ProjectStatus.SOLD },
    });

    await tx.user.update({
      where: { id: transaction.seller_id },
      data: { wallet_balance: { increment: transaction.seller_earnings } },
    });

    return updated;
  });

  // Contrat de cession : sa generation ne doit pas remettre en cause la vente.
  try {
    const pdfBytes = await generateTransferContract({
      transactionId: transaction.id,
      projectTitle: transaction.project.title,
      projectSlug: transaction.project.slug,
      contentHash: transaction.project.content_hash ?? 'non disponible',
      submittedAt: transaction.project.submitted_at ?? transaction.project.created_at,
      soldAt: new Date(),
      amount: transaction.amount,
      currency: transaction.project.currency,
      platformFee: transaction.platform_fee,
      sellerEarnings: transaction.seller_earnings,
      paymentMethod: PAYMENT_METHOD_LABELS[transaction.payment_method],
      seller: transaction.seller,
      buyer: transaction.buyer,
    });

    if (isStorageConfigured()) {
      const path = await uploadGeneratedPdf(
        pdfBytes,
        `private/contrats/${transaction.id}.pdf`,
      );
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { contract_url: path },
      });
    }
  } catch (error) {
    console.error('[transactions] echec de generation du contrat :', error);
  }

  const amountLabel = formatCurrency(transaction.amount, transaction.project.currency);
  const earningsLabel = formatCurrency(transaction.seller_earnings, transaction.project.currency);

  await notify({
    userId: transaction.seller_id,
    type: NotificationType.PROJECT_SOLD,
    title: 'Projet vendu',
    body: `"${transaction.project.title}" a ete vendu pour ${amountLabel}. Net vendeur : ${earningsLabel}.`,
    link: '/tableau-de-bord/ventes',
  });

  await notify({
    userId: transaction.seller_id,
    type: NotificationType.PAYMENT_RECEIVED,
    title: 'Paiement credite',
    body: `${earningsLabel} ont ete credites sur votre portefeuille.`,
    link: '/tableau-de-bord/portefeuille',
  });

  await notify({
    userId: transaction.buyer_id,
    type: NotificationType.PROJECT_PURCHASED,
    title: 'Achat confirme',
    body: `Le dossier complet de "${transaction.project.title}" est desormais accessible.`,
    link: `/projets/${transaction.project.slug}`,
  });

  await sendSaleEmail(transaction.seller.email, transaction.project.title, earningsLabel);
  await sendPurchaseEmail(
    transaction.buyer.email,
    transaction.project.title,
    transaction.project.slug,
  );

  return completed;
}

/** Marque une transaction en litige (ouverture d'un signalement acheteur). */
export async function disputeTransaction(
  transactionId: string,
  userId: string,
  reason: string,
): Promise<Transaction> {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction) throw notFound('Transaction introuvable.');
  if (transaction.buyer_id !== userId) throw forbidden('Seul l acheteur peut ouvrir un litige.');
  if (transaction.status !== TransactionStatus.COMPLETED) {
    throw conflict('Seule une transaction finalisee peut faire l objet d un litige.');
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: TransactionStatus.DISPUTED },
  });

  await notify({
    userId: transaction.seller_id,
    type: NotificationType.PROJECT_SOLD,
    title: 'Litige ouvert',
    body: `Un litige a ete ouvert sur une de vos ventes. Motif : ${reason}`,
    link: '/tableau-de-bord/ventes',
  });

  return updated;
}

/** Rembourse une transaction (action administrateur). */
export async function refundTransaction(transactionId: string): Promise<Transaction> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { project: { select: { id: true, title: true, slug: true, currency: true } } },
  });
  if (!transaction) throw notFound('Transaction introuvable.');
  if (transaction.status === TransactionStatus.REFUNDED) return transaction;

  const refunded = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.REFUNDED },
    });

    // Le net vendeur est repris, l'acheteur est credite du montant paye.
    await tx.user.update({
      where: { id: transaction.seller_id },
      data: { wallet_balance: { decrement: transaction.seller_earnings } },
    });
    await tx.user.update({
      where: { id: transaction.buyer_id },
      data: { wallet_balance: { increment: transaction.amount } },
    });
    await tx.project.update({
      where: { id: transaction.project_id },
      data: { status: ProjectStatus.PUBLISHED },
    });

    return updated;
  });

  await notify({
    userId: transaction.buyer_id,
    type: NotificationType.PAYMENT_RECEIVED,
    title: 'Remboursement effectue',
    body: `${formatCurrency(transaction.amount, transaction.project.currency)} ont ete recredites sur votre portefeuille.`,
    link: '/tableau-de-bord/portefeuille',
  });

  return refunded;
}

/** Retrait du solde du portefeuille (stub operateur : enregistre et notifie). */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  method: MobileMoneyMethod,
  phone: string,
): Promise<{ amount: number; reference: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wallet_balance: true, country: true },
  });
  if (!user) throw notFound('Utilisateur introuvable.');
  if (amount > user.wallet_balance) {
    throw new PaymentError('Solde insuffisant pour ce retrait.', 'INSUFFICIENT_FUNDS');
  }

  const payout = await initiateMobileMoneyPayment({
    method,
    amount,
    currency: 'XOF',
    phone,
    projectId: 'withdrawal',
    buyerId: userId,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { wallet_balance: { decrement: amount } },
  });

  await notify({
    userId,
    type: NotificationType.WITHDRAWAL_PROCESSED,
    title: 'Retrait enregistre',
    body: `Votre demande de retrait de ${formatCurrency(amount)} est en cours de traitement (reference ${payout.reference}).`,
    link: '/tableau-de-bord/portefeuille',
  });

  return { amount, reference: payout.reference };
}
