import { Bell } from 'lucide-react';
import type { Metadata } from 'next';
import { NotificationList } from '@/app/tableau-de-bord/notifications/notification-list';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
};

export default async function NotificationsPage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return (
    <div>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
        <Bell className="h-6 w-6 text-primary" aria-hidden />
        Notifications
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Encheres, ventes, messages et decisions de moderation.
      </p>

      <div className="mt-6">
        <NotificationList
          initial={notifications.map((notification) => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            link: notification.link,
            is_read: notification.is_read,
            created_at: notification.created_at.toISOString(),
          }))}
          userId={user.id}
        />
      </div>
    </div>
  );
}
