import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardNav } from '@/app/tableau-de-bord/dashboard-nav';
import { countUnreadNotifications } from '@/lib/notifications';
import { countUnreadMessages } from '@/server/messages';
import { getSessionUser } from '@/server/session';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect('/connexion?callbackUrl=/tableau-de-bord');

  const [unreadNotifications, unreadMessages] = await Promise.all([
    countUnreadNotifications(user.id),
    countUnreadMessages(user.id),
  ]);

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <DashboardNav
          role={user.role}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
