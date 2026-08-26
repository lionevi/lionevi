import { NotificationType, type Message } from '@prisma/client';
import { moderateMessage } from '@/lib/ai/moderation';
import { notify } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { truncate } from '@/lib/utils';
import { conflict, forbidden, notFound } from '@/server/session';

export interface SendMessageResult {
  message: Message;
  blocked: boolean;
  reason: string | null;
}

/**
 * Envoie un message.
 *
 * Le message est toujours enregistre : un message bloque reste visible par son
 * auteur (avec le motif) et par la moderation, mais n'est pas remis au
 * destinataire ni notifie.
 */
export async function sendMessage(input: {
  senderId: string;
  receiverId: string;
  projectId?: string;
  content: string;
}): Promise<SendMessageResult> {
  if (input.senderId === input.receiverId) {
    throw conflict('Vous ne pouvez pas vous envoyer un message.');
  }

  const receiver = await prisma.user.findUnique({
    where: { id: input.receiverId },
    select: { id: true, is_banned: true },
  });
  if (!receiver) throw notFound('Destinataire introuvable.');
  if (receiver.is_banned) throw forbidden("Ce compte n'est plus actif.");

  if (input.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true },
    });
    if (!project) throw notFound('Projet introuvable.');
  }

  const moderation = await moderateMessage(input.content);

  const message = await prisma.message.create({
    data: {
      sender_id: input.senderId,
      receiver_id: input.receiverId,
      project_id: input.projectId ?? null,
      content: input.content,
      is_blocked: moderation.blocked,
    },
  });

  if (!moderation.blocked) {
    const sender = await prisma.user.findUnique({
      where: { id: input.senderId },
      select: { name: true },
    });
    await notify({
      userId: input.receiverId,
      type: NotificationType.NEW_MESSAGE,
      title: `Message de ${sender?.name ?? 'un utilisateur'}`,
      body: truncate(input.content, 120),
      link: `/tableau-de-bord/messages?avec=${input.senderId}`,
    });
  }

  return { message, blocked: moderation.blocked, reason: moderation.reason };
}

export interface ConversationSummary {
  peer: { id: string; name: string; avatar_url: string | null };
  last_message: { content: string; created_at: Date; is_read: boolean; from_me: boolean };
  unread_count: number;
}

/** Liste des conversations d'un utilisateur, la plus recente en premier. */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ sender_id: userId }, { receiver_id: userId, is_blocked: false }],
    },
    orderBy: { created_at: 'desc' },
    include: {
      sender: { select: { id: true, name: true, avatar_url: true } },
      receiver: { select: { id: true, name: true, avatar_url: true } },
    },
    take: 300,
  });

  const conversations = new Map<string, ConversationSummary>();

  for (const message of messages) {
    const fromMe = message.sender_id === userId;
    const peer = fromMe ? message.receiver : message.sender;

    const existing = conversations.get(peer.id);
    if (!existing) {
      conversations.set(peer.id, {
        peer,
        last_message: {
          content: message.is_blocked && fromMe ? '[Message bloque]' : message.content,
          created_at: message.created_at,
          is_read: message.is_read,
          from_me: fromMe,
        },
        unread_count: !fromMe && !message.is_read ? 1 : 0,
      });
      continue;
    }
    if (!fromMe && !message.is_read) existing.unread_count += 1;
  }

  return [...conversations.values()].sort(
    (a, b) => b.last_message.created_at.getTime() - a.last_message.created_at.getTime(),
  );
}

/** Fil de discussion avec un interlocuteur ; marque les messages recus comme lus. */
export async function getConversation(
  userId: string,
  peerId: string,
): Promise<Array<Message & { sender: { id: string; name: string; avatar_url: string | null } }>> {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { sender_id: userId, receiver_id: peerId },
        // Les messages bloques ne sont jamais remis au destinataire.
        { sender_id: peerId, receiver_id: userId, is_blocked: false },
      ],
    },
    orderBy: { created_at: 'asc' },
    include: { sender: { select: { id: true, name: true, avatar_url: true } } },
    take: 500,
  });

  await prisma.message.updateMany({
    where: { sender_id: peerId, receiver_id: userId, is_read: false },
    data: { is_read: true },
  });

  return messages;
}

export async function countUnreadMessages(userId: string): Promise<number> {
  return prisma.message.count({
    where: { receiver_id: userId, is_read: false, is_blocked: false },
  });
}
