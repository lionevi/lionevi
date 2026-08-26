import { ArrowRight, Fingerprint, Gavel, HandCoins, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AI_SCORE_THRESHOLDS, DEFAULT_PLATFORM_FEE_PERCENT, SIMILARITY_THRESHOLDS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Comment ca marche',
  description:
    "Le parcours complet d'une idee sur IdeaMarket Africa : depot, empreinte SHA-256, controle d'unicite, evaluation IA, NDA, vente et contrat de cession.",
};

const SELLER_STEPS = [
  {
    icon: Layers,
    title: 'Rediger un dossier en trois couches',
    body: "La couche publique expose le probleme et le marche. La couche NDA ajoute le resume executif, la taille de marche et l'avantage concurrentiel. La couche privee — la solution, le modele economique, les etapes, les ressources — n'est livree qu'a l'acquereur.",
  },
  {
    icon: Fingerprint,
    title: 'Sceller son anteriorite',
    body: "A la soumission, le contenu complet est hache en SHA-256 et horodate. Vous recevez un certificat d'anteriorite telechargeable, opposable en cas de litige. Toute modification produit une empreinte differente.",
  },
  {
    icon: Sparkles,
    title: "Passer le controle d'unicite et l'evaluation",
    body: `Votre dossier est compare a tous les projets publies. Au-dela de ${SIMILARITY_THRESHOLDS.HIGH_MAX} % de similarite, il est refuse ; entre ${SIMILARITY_THRESHOLDS.MODERATE_MAX + 1} et ${SIMILARITY_THRESHOLDS.HIGH_MAX} %, une note de differenciation est exigee. L'evaluation note ensuite six criteres et attribue votre badge.`,
  },
  {
    icon: HandCoins,
    title: 'Vendre et encaisser',
    body: `Prix fixe ou enchere, en francs CFA ou en devise. A la vente, la plateforme prend ${DEFAULT_PLATFORM_FEE_PERCENT} % ; le net est credite sur votre portefeuille, retirable vers Wave, Orange Money ou MTN MoMo.`,
  },
] as const;

const BUYER_STEPS = [
  {
    icon: ShieldCheck,
    title: 'Signer le NDA',
    body: "Gratuit et immediat. Votre signature electronique (identifiant, adresse IP, horodatage) debloque la couche confidentielle et vous engage a ne pas exploiter l'idee sans l'acquerir.",
  },
  {
    icon: Gavel,
    title: 'Acheter ou encherir',
    body: "En prix fixe, l'achat est immediat. En enchere, chaque offre doit depasser la precedente d'au moins 5 % ; toute offre deposee dans les 5 dernieres minutes prolonge la vente de 5 minutes.",
  },
  {
    icon: Layers,
    title: 'Recevoir le dossier et le contrat',
    body: "Des l'encaissement, le dossier complet et les pieces jointes privees se debloquent, et un contrat de cession de droits en PDF est genere a votre nom, avec l'empreinte du depot et sa date.",
  },
] as const;

export default function HowItWorksPage(): React.JSX.Element {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Comment ca marche</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        IdeaMarket Africa est une place de marche ou une idee documentee devient un actif
        transferable. Voici le parcours, cote vendeur puis cote acheteur.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Vous vendez une idee</h2>
        <div className="mt-5 space-y-4">
          {SELLER_STEPS.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="flex gap-4 py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Vous achetez un projet</h2>
        <div className="mt-5 space-y-4">
          {BUYER_STEPS.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="flex gap-4 py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <step.icon className="h-5 w-5 text-accent" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Comprendre le score d&apos;evaluation</h2>
        <p className="mt-2 text-muted-foreground">
          Six criteres sont notes de 0 a 100 puis ponderes : originalite (20 %), faisabilite (20 %),
          potentiel de marche (20 %), viabilite economique (15 %), clarte (15 %) et pertinence pour
          le marche africain (10 %).
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { level: 'Premium', range: `${AI_SCORE_THRESHOLDS.PREMIUM} et plus`, tone: 'border-success/40 bg-success/8' },
            { level: 'Featured', range: `${AI_SCORE_THRESHOLDS.FEATURED} a ${AI_SCORE_THRESHOLDS.PREMIUM - 1}`, tone: 'border-primary/40 bg-primary/8' },
            { level: 'Standard', range: `${AI_SCORE_THRESHOLDS.STANDARD} a ${AI_SCORE_THRESHOLDS.FEATURED - 1}`, tone: 'border-border bg-muted' },
            { level: 'Low', range: `moins de ${AI_SCORE_THRESHOLDS.STANDARD}`, tone: 'border-error/40 bg-error/8' },
          ].map((badge) => (
            <div key={badge.level} className={`rounded-xl border p-4 ${badge.tone}`}>
              <p className="font-display text-sm font-bold">{badge.level}</p>
              <p className="mt-1 text-xs text-muted-foreground">Score {badge.range}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/vendre">
            Deposer mon idee
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/projets">Explorer les projets</Link>
        </Button>
      </div>
    </div>
  );
}
