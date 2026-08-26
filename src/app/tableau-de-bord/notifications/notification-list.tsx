'use client';

import type { NotificationType } from '@prisma/client';
import { BellOff, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NOTIFICATION_LABELS } from '@/lib/notifications';
import { useRealtime } from '@/lib/realtime';
import { cn, formatRelative } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

/** Liste des notifications, mise a jour en direct et marquage comme lu. */
export function NotificationList({
  initial,
  userId,
}: {
  initial: NotificationItem[];
  userId: string;
}): React.JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { notifications: NotificationItem[] };
      setItems(data.notifications);
      router.refresh();
    } catch {
      // Silencieux : la liste affichee reste la derniere connue.
    }
  }, [router]);

  useRealtime({
    table: 'Notification',
    filter: `user_id=eq.${userId}`,
    onChange: () => void refresh(),
  });

  async function markAll(): Promise<void> {
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }

  async function markOne(id: string): Promise<void> {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  const unread = items.filter((item) => !item.is_read).length;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="Aucune notification"
        description="Vous serez prevenu ici des qu'une enchere, un message ou une vente vous concerne."
      />
    );
  }

  return (
    <div>
      {unread > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unread} notification{unread > 1 ? 's' : ''} non lue{unread > 1 ? 's' : ''}
          </p>
          <Button variant="ghost" size="sm" onClick={() => void markAll()}>
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((item) => {
          const content = (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={item.is_read ? 'muted' : 'default'}>
                  {NOTIFICATION_LABELS[item.type]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(item.created_at)}
                </span>
              </div>
              <p className="mt-1.5 font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
            </>
          );

          return (
            <li key={item.id}>
              {item.link ? (
                <Link
                  href={item.link}
                  onClick={() => void markOne(item.id)}
                  className={cn(
                    'block rounded-xl border p-4 transition-colors hover:border-primary/40',
                    item.is_read ? 'border-border bg-card' : 'border-primary/30 bg-primary/5',
                  )}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void markOne(item.id)}
                  className={cn(
                    'block w-full rounded-xl border p-4 text-left transition-colors hover:border-primary/40',
                    item.is_read ? 'border-border bg-card' : 'border-primary/30 bg-primary/5',
                  )}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
