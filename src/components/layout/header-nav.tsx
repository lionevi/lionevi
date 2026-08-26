'use client';

import { Bell, LogOut, Menu, MessageSquare, Plus, User as UserIcon, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn, initials } from '@/lib/utils';
import type { SessionUser } from '@/server/session';

const NAV_LINKS = [
  { href: '/projets', label: 'Explorer' },
  { href: '/encheres', label: 'Encheres' },
  { href: '/comment-ca-marche', label: 'Comment ca marche' },
] as const;

interface HeaderNavProps {
  user: SessionUser | null;
  unreadNotifications: number;
  unreadMessages: number;
}

export function HeaderNav({
  user,
  unreadNotifications,
  unreadMessages,
}: HeaderNavProps): React.JSX.Element {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Referme le menu mobile a chaque navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground',
              pathname.startsWith(link.href) && 'bg-muted text-foreground',
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link
              href="/tableau-de-bord/messages"
              className="relative hidden rounded-lg p-2.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground sm:block"
              aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} non lus)` : ''}`}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && <NotificationDot count={unreadMessages} />}
            </Link>

            <Link
              href="/tableau-de-bord/notifications"
              className="relative rounded-lg p-2.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} non lues)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && <NotificationDot count={unreadNotifications} />}
            </Link>

            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/vendre">
                <Plus className="h-4 w-4" />
                Vendre une idee
              </Link>
            </Button>

            <Link
              href="/tableau-de-bord"
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-secondary/25 text-xs font-bold text-secondary-700 transition-colors hover:bg-secondary/40 md:flex"
              aria-label="Mon tableau de bord"
            >
              {initials(user.name)}
            </Link>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/connexion">Se connecter</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/inscription">Creer un compte</Link>
            </Button>
          </>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg p-2.5 text-foreground/70 transition-colors hover:bg-muted md:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-16 z-50 animate-fade-in border-b border-border bg-card p-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/vendre" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                  Vendre une idee
                </Link>
                <Link
                  href="/tableau-de-bord"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted"
                >
                  <UserIcon className="h-4 w-4" />
                  Mon tableau de bord
                </Link>
                <Link
                  href="/tableau-de-bord/messages"
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted"
                >
                  Messages {unreadMessages > 0 && `(${unreadMessages})`}
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-error hover:bg-error/10"
                >
                  <LogOut className="h-4 w-4" />
                  Se deconnecter
                </button>
              </>
            ) : (
              <Link href="/connexion" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                Se connecter
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

function NotificationDot({ count }: { count: number }): React.JSX.Element {
  return (
    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {count > 9 ? '9+' : count}
    </span>
  );
}
