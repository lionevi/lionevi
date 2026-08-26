import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { messageSchema } from '@/lib/validation';
import { getConversation, listConversations, sendMessage } from '@/server/messages';
import { requireUser } from '@/server/session';

/** Conversations de l'utilisateur, ou fil avec un interlocuteur (`?avec=<id>`). */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const peerId = request.nextUrl.searchParams.get('avec');

    if (peerId) return ok({ messages: await getConversation(user.id, peerId) });
    return ok({ conversations: await listConversations(user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Envoi d'un message (filtre par la moderation avant remise). */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const input = messageSchema.parse(await readJson(request));

    const result = await sendMessage({
      senderId: user.id,
      receiverId: input.receiver_id,
      projectId: input.project_id,
      content: input.content,
    });

    return ok(
      {
        message: result.message,
        blocked: result.blocked,
        reason: result.reason,
      },
      result.blocked ? 200 : 201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
