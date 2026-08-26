import { Role } from '@prisma/client';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getSessionUser } from '@/server/session';

const LINKS = [
  { href: '/admin', label: 'Indicateurs' },
  { href: '/admin/moderation', label: 'Moderation' },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect('/connexion?callbackUrl=/admin');
  if (user.role !== Role.ADMIN) redirect('/tableau-de-bord');

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <h1 className="flex items-center gap-2 font-display text-xl font-bold">
          <ShieldCheck className="h-5 w-5 text-accent" aria-hidden />
          Administration
        </h1>
        <nav className="flex gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
