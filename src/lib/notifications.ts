import { NotificationType, type Notification } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

/**
 * Cree une notification in-app.
 * Les erreurs sont journalisees sans interrompre le flux metier appelant :
 * une notification perdue ne doit jamais annuler une vente.
 */
export async function notify(input: NotificationInput): Promise<Notification | null> {
  try {
    return await prisma.notification.create({
      data: {
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });
  } catch (error) {
    console.error('[notifications] echec de creation :', error);
    return null;
  }
}

/** Cree plusieurs notifications en une seule requete. */
export async function notifyMany(inputs: NotificationInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  try {
    const result = await prisma.notification.createMany({
      data: inputs.map((input) => ({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      })),
    });
    return result.count;
  } catch (error) {
    console.error('[notifications] echec de creation groupee :', error);
    return 0;
  }
}

export async function markNotificationRead(id: string, userId: string): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id, user_id: userId },
    data: { is_read: true },
  });
  return result.count > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
  return result.count;
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({ where: { user_id: userId, is_read: false } });
}

/** Libelles francais associes aux types de notification. */
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  NEW_BID: 'Nouvelle enchere',
  OUTBID: 'Enchere depassee',
  AUCTION_WON: 'Enchere remportee',
  AUCTION_LOST: 'Enchere perdue',
  PROJECT_SOLD: 'Projet vendu',
  PROJECT_PURCHASED: 'Achat confirme',
  NEW_MESSAGE: 'Nouveau message',
  PROJECT_REVIEWED: 'Projet evalue',
  PROJECT_PUBLISHED: 'Projet publie',
  PROJECT_REJECTED: 'Projet refuse',
  PAYMENT_RECEIVED: 'Paiement recu',
  WITHDRAWAL_PROCESSED: 'Retrait traite',
  SIMILARITY_ALERT: 'Alerte de similarite',
};

export { NotificationType };
