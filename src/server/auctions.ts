import {
  BidStatus,
  NotificationType,
  ProjectStatus,
  SellingMode,
  type Bid,
  type Project,
} from '@prisma/client';
import { AUCTION_ANTI_SNIPE_MINUTES, MIN_BID_INCREMENT_PERCENT } from '@/lib/constants';
import { sendAuctionWonEmail, sendOutbidEmail } from '@/lib/email';
import { notify } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { isReserveMet, minimumNextBid } from '@/lib/scoring';
import { formatCurrency } from '@/lib/utils';
import { conflict, forbidden, notFound } from '@/server/session';

export interface AuctionState {
  highest_bid: number | null;
  highest_bidder_id: string | null;
  bid_count: number;
  minimum_bid: number;
  reserve_met: boolean;
  ends_at: Date | null;
  is_open: boolean;
}

/** Etat public d'une enchere (le prix de reserve reste masque). */
export async function getAuctionState(project: Project): Promise<AuctionState> {
  if (project.selling_mode !== SellingMode.AUCTION) {
    return {
      highest_bid: null,
      highest_bidder_id: null,
      bid_count: 0,
      minimum_bid: 0,
      reserve_met: true,
      ends_at: null,
      is_open: false,
    };
  }

  const [highest, count] = await Promise.all([
    prisma.bid.findFirst({
      where: { project_id: project.id },
      orderBy: { amount: 'desc' },
      select: { amount: true, bidder_id: true },
    }),
    prisma.bid.count({ where: { project_id: project.id } }),
  ]);

  const startPrice = project.auction_start_price ?? 0;
  const isOpen =
    project.status === ProjectStatus.PUBLISHED &&
    project.auction_end_date !== null &&
    project.auction_end_date.getTime() > Date.now();

  return {
    highest_bid: highest?.amount ?? null,
    highest_bidder_id: highest?.bidder_id ?? null,
    bid_count: count,
    minimum_bid: minimumNextBid(startPrice, highest?.amount ?? null, MIN_BID_INCREMENT_PERCENT),
    reserve_met: isReserveMet(highest?.amount ?? null, project.auction_reserve_price),
    ends_at: project.auction_end_date,
    is_open: isOpen,
  };
}

export interface PlaceBidResult {
  bid: Bid;
  auction: AuctionState;
  extended: boolean;
}

/**
 * Depose une enchere.
 *
 * Les controles de concurrence sont faits dans une transaction serialisable :
 * deux encheres simultanees ne peuvent pas valider le meme montant.
 * Si l'offre arrive dans les dernieres minutes, la fin est repoussee
 * (anti-sniping).
 */
export async function placeBid(
  projectId: string,
  bidderId: string,
  amount: number,
): Promise<PlaceBidResult> {
  const result = await prisma.$transaction(
    async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project) throw notFound('Projet introuvable.');
      if (project.selling_mode !== SellingMode.AUCTION) {
        throw conflict("Ce projet n'est pas vendu aux encheres.");
      }
      if (project.status !== ProjectStatus.PUBLISHED) {
        throw conflict("Cette enchere n'est pas ouverte.");
      }
      if (project.seller_id === bidderId) {
        throw forbidden('Vous ne pouvez pas encherir sur votre propre projet.');
      }
      if (!project.auction_end_date || project.auction_end_date.getTime() <= Date.now()) {
        throw conflict('Cette enchere est terminee.');
      }

      const highest = await tx.bid.findFirst({
        where: { project_id: projectId },
        orderBy: { amount: 'desc' },
        select: { id: true, amount: true, bidder_id: true },
      });

      const minimum = minimumNextBid(
        project.auction_start_price ?? 0,
        highest?.amount ?? null,
        MIN_BID_INCREMENT_PERCENT,
      );

      if (amount < minimum) {
        throw conflict(
          `Votre offre doit etre d'au moins ${formatCurrency(minimum, project.currency)}.`,
        );
      }

      // L'ancienne meilleure offre passe en ACTIVE (elle reste valable, mais
      // n'est plus en tete) ; la nouvelle devient WINNING.
      if (highest) {
        await tx.bid.update({ where: { id: highest.id }, data: { status: BidStatus.ACTIVE } });
      }

      const bid = await tx.bid.create({
        data: { project_id: projectId, bidder_id: bidderId, amount, status: BidStatus.WINNING },
      });

      const msRemaining = project.auction_end_date.getTime() - Date.now();
      const antiSnipeMs = AUCTION_ANTI_SNIPE_MINUTES * 60 * 1000;
      let extended = false;

      if (msRemaining < antiSnipeMs) {
        await tx.project.update({
          where: { id: projectId },
          data: { auction_end_date: new Date(Date.now() + antiSnipeMs) },
        });
        extended = true;
      }

      return { bid, project, previousBidder: highest?.bidder_id ?? null, extended };
    },
    { timeout: 10_000 },
  );

  // Notifications hors transaction : leur echec ne doit pas annuler l'enchere.
  await notify({
    userId: result.project.seller_id,
    type: NotificationType.NEW_BID,
    title: 'Nouvelle enchere',
    body: `Offre de ${formatCurrency(amount, result.project.currency)} sur "${result.project.title}".`,
    link: `/projets/${result.project.slug}`,
  });

  if (result.previousBidder && result.previousBidder !== bidderId) {
    await notify({
      userId: result.previousBidder,
      type: NotificationType.OUTBID,
      title: 'Vous avez ete depasse',
      body: `Une offre superieure a ete deposee sur "${result.project.title}".`,
      link: `/projets/${result.project.slug}`,
    });

    const previous = await prisma.user.findUnique({
      where: { id: result.previousBidder },
      select: { email: true },
    });
    if (previous?.email) {
      await sendOutbidEmail(
        previous.email,
        result.project.title,
        result.project.slug,
        formatCurrency(amount, result.project.currency),
      );
    }
  }

  const updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  return {
    bid: result.bid,
    auction: await getAuctionState(updatedProject),
    extended: result.extended,
  };
}

export interface AuctionClosure {
  project_id: string;
  title: string;
  outcome: 'WON' | 'NO_BID' | 'RESERVE_NOT_MET';
  winning_bid_id: string | null;
  amount: number | null;
}

/**
 * Cloture les encheres arrivees a echeance.
 * Appelee par la tache planifiee `/api/cron/close-auctions`.
 */
export async function closeExpiredAuctions(): Promise<AuctionClosure[]> {
  const expired = await prisma.project.findMany({
    where: {
      selling_mode: SellingMode.AUCTION,
      status: ProjectStatus.PUBLISHED,
      auction_end_date: { lte: new Date() },
    },
    include: { seller: { select: { id: true, email: true } } },
  });

  const closures: AuctionClosure[] = [];

  for (const project of expired) {
    const bids = await prisma.bid.findMany({
      where: { project_id: project.id },
      orderBy: { amount: 'desc' },
      include: { bidder: { select: { id: true, email: true } } },
    });

    const winning = bids[0];

    if (!winning) {
      await prisma.project.update({
        where: { id: project.id },
        data: { status: ProjectStatus.ARCHIVED },
      });
      await notify({
        userId: project.seller_id,
        type: NotificationType.AUCTION_LOST,
        title: 'Enchere close sans offre',
        body: `"${project.title}" n'a recu aucune offre. Le projet a ete archive.`,
        link: '/tableau-de-bord/projets',
      });
      closures.push({
        project_id: project.id,
        title: project.title,
        outcome: 'NO_BID',
        winning_bid_id: null,
        amount: null,
      });
      continue;
    }

    if (!isReserveMet(winning.amount, project.auction_reserve_price)) {
      await prisma.$transaction([
        prisma.bid.updateMany({
          where: { project_id: project.id },
          data: { status: BidStatus.REFUNDED },
        }),
        prisma.project.update({
          where: { id: project.id },
          data: { status: ProjectStatus.ARCHIVED },
        }),
      ]);

      await notify({
        userId: project.seller_id,
        type: NotificationType.AUCTION_LOST,
        title: 'Prix de reserve non atteint',
        body: `La meilleure offre sur "${project.title}" n'a pas atteint votre prix de reserve.`,
        link: '/tableau-de-bord/projets',
      });

      closures.push({
        project_id: project.id,
        title: project.title,
        outcome: 'RESERVE_NOT_MET',
        winning_bid_id: winning.id,
        amount: winning.amount,
      });
      continue;
    }

    await prisma.$transaction([
      prisma.bid.update({ where: { id: winning.id }, data: { status: BidStatus.WINNING } }),
      prisma.bid.updateMany({
        where: { project_id: project.id, id: { not: winning.id } },
        data: { status: BidStatus.LOST },
      }),
    ]);

    await notify({
      userId: winning.bidder_id,
      type: NotificationType.AUCTION_WON,
      title: 'Enchere remportee',
      body: `Vous remportez "${project.title}" pour ${formatCurrency(winning.amount, project.currency)}. Finalisez le paiement.`,
      link: `/projets/${project.slug}/paiement`,
    });

    await notify({
      userId: project.seller_id,
      type: NotificationType.PROJECT_SOLD,
      title: 'Enchere adjugee',
      body: `"${project.title}" est adjuge a ${formatCurrency(winning.amount, project.currency)}. En attente du paiement.`,
      link: `/tableau-de-bord/projets`,
    });

    if (winning.bidder.email) {
      await sendAuctionWonEmail(
        winning.bidder.email,
        project.title,
        project.slug,
        formatCurrency(winning.amount, project.currency),
      );
    }

    for (const lost of bids.slice(1)) {
      await notify({
        userId: lost.bidder_id,
        type: NotificationType.AUCTION_LOST,
        title: 'Enchere perdue',
        body: `L'enchere sur "${project.title}" est terminee. Votre offre n'a pas ete retenue.`,
        link: `/projets/${project.slug}`,
      });
    }

    closures.push({
      project_id: project.id,
      title: project.title,
      outcome: 'WON',
      winning_bid_id: winning.id,
      amount: winning.amount,
    });
  }

  return closures;
}

/** Montant du au titre d'une enchere remportee, ou null si l'utilisateur n'est pas le gagnant. */
export async function getWinningAmount(
  projectId: string,
  userId: string,
): Promise<number | null> {
  const winning = await prisma.bid.findFirst({
    where: { project_id: projectId },
    orderBy: { amount: 'desc' },
    select: { amount: true, bidder_id: true },
  });
  if (!winning || winning.bidder_id !== userId) return null;
  return winning.amount;
}
