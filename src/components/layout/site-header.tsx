import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { getSessionUser } from '@/server/session';
import { countUnreadNotifications } from '@/lib/notifications';
import { countUnreadMessages } from '@/server/messages';
import { HeaderNav } from '@/components/layout/header-nav';

/**
 * En-tete du site. Composant serveur : il resout la session et les compteurs,
 * puis delegue l'interactivite (menu mobile, menu compte) a `HeaderNav`.
 */
export async function SiteHeader(): Promise<React.JSX.Element> {
  const user = await getSessionUser();

  const [unreadNotifications, unreadMessages] = user
    ? await Promise.all([countUnreadNotifications(user.id), countUnreadMessages(user.id)])
    : [0, 0];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME} — accueil`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-base font-extrabold text-primary-foreground">
            iM
          </span>
          <span className="hidden font-display text-base font-bold leading-tight sm:block">
            IdeaMarket
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-600">
              Africa
            </span>
          </span>
        </Link>

        <HeaderNav
          user={user}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />
      </div>
    </header>
  );
}
