'use client';

import type { Role } from '@prisma/client';
import {
  Bell,
  Gavel,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingBag,
  UserCog,
  Wallet,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: 'messages' | 'notifications';
}

const LINKS: NavLink[] = [
  { href: '/tableau-de-bord', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: '/tableau-de-bord/projets', label: 'Mes projets', icon: Package },
  { href: '/tableau-de-bord/ventes', label: 'Mes ventes', icon: ShoppingBag },
  { href: '/tableau-de-bord/achats', label: 'Mes achats', icon: Package },
  { href: '/tableau-de-bord/encheres', label: 'Mes encheres', icon: Gavel },
  { href: '/tableau-de-bord/favoris', label: 'Favoris', icon: Heart },
  { href: '/tableau-de-bord/messages', label: 'Messages', icon: MessageSquare, badge: 'messages' },
  {
    href: '/tableau-de-bord/notifications',
    label: 'Notifications',
    icon: Bell,
    badge: 'notifications',
  },
  { href: '/tableau-de-bord/portefeuille', label: 'Portefeuille', icon: Wallet },
  { href: '/tableau-de-bord/profil', label: 'Mon profil', icon: UserCog },
];

interface DashboardNavProps {
  role: Role;
  unreadNotifications: number;
  unreadMessages: number;
}

export function DashboardNav({
  role,
  unreadNotifications,
  unreadMessages,
}: DashboardNavProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation du tableau de bord" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const count =
            link.badge === 'messages'
              ? unreadMessages
              : link.badge === 'notifications'
                ? unreadNotifications
                : 0;

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground/75 hover:bg-muted',
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" aria-hidden />
                {link.label}
                {count > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}

        {role === 'ADMIN' && (
          <li className="shrink-0">
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-accent/10 text-accent'
                  : 'text-foreground/75 hover:bg-muted',
              )}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Administration
            </Link>
          </li>
        )}

        <li className="shrink-0">
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Deconnexion
          </button>
        </li>
      </ul>
    </nav>
  );
}
