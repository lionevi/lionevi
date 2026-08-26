import type { Metadata } from 'next';
import { MessagesClient } from '@/app/tableau-de-bord/messages/messages-client';
import { getConversation, listConversations } from '@/server/messages';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Messages', robots: { index: false, follow: false } };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { avec?: string };
}): Promise<React.JSX.Element> {
  const user = await requireUser();
  const peerId = searchParams.avec;

  const [conversations, peer, thread] = await Promise.all([
    listConversations(user.id),
    peerId
      ? prisma.user.findUnique({
          where: { id: peerId },
          select: { id: true, name: true, avatar_url: true },
        })
      : null,
    peerId ? getConversation(user.id, peerId) : [],
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les echanges restent sur la plateforme jusqu&apos;a la signature du contrat de cession.
      </p>

      <div className="mt-6">
        <MessagesClient
          userId={user.id}
          conversations={conversations.map((conversation) => ({
            peer: conversation.peer,
            last_message: {
              content: conversation.last_message.content,
              created_at: conversation.last_message.created_at.toISOString(),
              from_me: conversation.last_message.from_me,
            },
            unread_count: conversation.unread_count,
          }))}
          activePeer={peer}
          initialMessages={thread.map((message) => ({
            id: message.id,
            content: message.content,
            sender_id: message.sender_id,
            is_blocked: message.is_blocked,
            created_at: message.created_at.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
