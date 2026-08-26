import { ArrowRight, FileCheck2, Fingerprint, Gavel, ShieldCheck, Sparkles, Store } from 'lucide-react';
import Link from 'next/link';
import { ProjectCard } from '@/components/project-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { listActiveAuctions, listFeaturedProjects } from '@/server/projects';

// Les compteurs et les projets a la une refletent l'etat courant de la base.
export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: Fingerprint,
    title: 'Deposez votre idee',
    body: "Votre dossier est scelle par une empreinte SHA-256 horodatee. Votre anteriorite est enregistree avant toute mise en ligne.",
  },
  {
    icon: Sparkles,
    title: "L'IA evalue et protege",
    body: "Controle d'unicite contre tous les projets publies, puis notation sur six criteres. Seul un teaser public est expose.",
  },
  {
    icon: ShieldCheck,
    title: "L'acheteur signe un NDA",
    body: 'Le resume executif ne se debloque qu apres signature electronique. Le dossier complet, lui, se debloque a l achat.',
  },
  {
    icon: FileCheck2,
    title: 'Vente et contrat automatique',
    body: 'Paiement par carte ou Mobile Money, contrat de cession de droits genere en PDF, fonds credites sur votre portefeuille.',
  },
] as const;

export default async function HomePage(): Promise<React.JSX.Element> {
  const [featured, auctions, stats] = await Promise.all([
    listFeaturedProjects(6),
    listActiveAuctions(3),
    Promise.all([
      prisma.project.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count(),
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),
    ]),
  ]);

  const [publishedCount, userCount, salesCount] = stats;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-5">
              <Fingerprint className="h-3.5 w-3.5" aria-hidden />
              Depot horodate et empreinte SHA-256
            </Badge>

            <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              Votre idee vaut mieux qu&apos;un tiroir.
              <span className="block text-primary">Vendez-la.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground/75">
              IdeaMarket Africa met en relation ceux qui ont les idees et ceux qui ont les moyens de
              les realiser. Evaluation par IA, controle d&apos;unicite, contrat de cession
              automatique, paiement Mobile Money.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/vendre">
                  Vendre mon idee
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/projets">
                  <Store className="h-4 w-4" />
                  Explorer les projets
                </Link>
              </Button>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {[
                { label: 'Projets en vente', value: publishedCount },
                { label: 'Membres', value: userCount },
                { label: 'Cessions realisees', value: salesCount },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-2xl font-bold">{formatNumber(stat.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Projets a la une */}
      <section className="section">
        <div className="container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Idees a la une</h2>
              <p className="mt-1.5 text-muted-foreground">
                Les dossiers les mieux notes par notre evaluation automatique.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/projets">
                Tout voir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featured.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-border bg-card/60 p-10 text-center">
              <p className="font-display text-lg font-semibold">La marketplace ouvre ses portes</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                Aucun projet n&apos;est encore publie. Soyez le premier a deposer votre idee et a
                obtenir votre certificat d&apos;anteriorite.
              </p>
              <Button asChild className="mt-5">
                <Link href="/vendre">Deposer mon idee</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Encheres */}
      {auctions.length > 0 && (
        <section className="section bg-card">
          <div className="container">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
                  <Gavel className="h-6 w-6 text-primary" aria-hidden />
                  Encheres en cours
                </h2>
                <p className="mt-1.5 text-muted-foreground">
                  Le meilleur offrant emporte les droits sur le dossier complet.
                </p>
              </div>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/encheres">
                  Toutes les encheres
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {auctions.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fonctionnement */}
      <section className="section">
        <div className="container">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Comment ca marche</h2>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            Quatre etapes, de la protection de votre idee jusqu&apos;au versement des fonds.
          </p>

          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <span className="font-display text-sm font-bold text-secondary-600">
                    Etape {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Categories */}
      <section className="section bg-card">
        <div className="container">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Explorer par secteur</h2>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/projets?categorie=${encodeURIComponent(category)}`}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="section">
        <div className="container">
          <div className="overflow-hidden rounded-2xl bg-accent px-6 py-12 text-center sm:px-12">
            <h2 className="font-display text-2xl font-bold text-accent-foreground sm:text-3xl">
              Une idee qui dort ne rapporte rien
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-accent-foreground/80">
              Deposez-la aujourd&apos;hui : empreinte SHA-256, horodatage, evaluation IA et mise en
              vente. Vous ne payez qu&apos;une commission a la vente.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href="/vendre">
                Deposer mon idee
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
