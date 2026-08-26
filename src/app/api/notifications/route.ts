import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/session';

/** Notifications de l'utilisateur (les 50 plus recentes). */
export async function GET(): Promise<Response> {
  try {
    const user = await requireUser();
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { user_id: user.id, is_read: false } }),
    ]);
    return ok({ notifications, unread });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Marque une notification (ou toutes) comme lue. */
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const body = (await readJson(request)) as { id?: string; all?: boolean };

    if (body.all) return ok({ updated: await markAllNotificationsRead(user.id) });
    if (body.id) return ok({ updated: (await markNotificationRead(body.id, user.id)) ? 1 : 0 });

    return ok({ updated: 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
