import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

const FOOTER_SECTIONS = [
  {
    title: 'Marketplace',
    links: [
      { href: '/projets', label: 'Explorer les idees' },
      { href: '/encheres', label: 'Encheres en cours' },
      { href: '/vendre', label: 'Vendre une idee' },
    ],
  },
  {
    title: 'Comprendre',
    links: [
      { href: '/comment-ca-marche', label: 'Comment ca marche' },
      { href: '/protection-des-idees', label: 'Protection des idees' },
      { href: '/tarifs', label: 'Commissions et tarifs' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/conditions', label: "Conditions d'utilisation" },
      { href: '/confidentialite', label: 'Politique de confidentialite' },
      { href: '/contact', label: 'Contact' },
    ],
  },
] as const;

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-base font-extrabold text-primary-foreground">
                iM
              </span>
              <span className="font-display text-base font-bold leading-tight">
                IdeaMarket
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-600">
                  Africa
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              La marketplace ou les idees d&apos;entreprise trouvent leurs batisseurs. Chaque depot
              est horodate et scelle par une empreinte SHA-256.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits reserves.
          </p>
          <p className="text-xs text-muted-foreground">
            Concu pour l&apos;Afrique de l&apos;Ouest francophone — paiements Mobile Money et carte
            bancaire.
          </p>
        </div>
      </div>
    </footer>
  );
}
