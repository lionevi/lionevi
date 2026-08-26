import { AlertTriangle, Fingerprint, Layers, Lock, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Protection des idees',
  description:
    "Comment IdeaMarket Africa protege les idees deposees : empreinte SHA-256 horodatee, divulgation en trois couches, NDA opposable et contrat de cession.",
};

const MECHANISMS = [
  {
    icon: Fingerprint,
    title: 'Empreinte SHA-256 et horodatage',
    body: "Au depot, le contenu complet de votre dossier est normalise puis hache en SHA-256. L'empreinte et la date de depot sont enregistrees dans un registre interne et reportees sur votre certificat d'anteriorite. Modifier une virgule change l'empreinte : l'integrite du contenu date est donc verifiable.",
  },
  {
    icon: Layers,
    title: 'Divulgation en trois couches',
    body: "Le public ne voit jamais le mode operatoire. Seul le probleme, le marche et un teaser genere par IA sont exposes. La solution, le modele economique detaille, les etapes et les contacts restent scelles jusqu'a la vente.",
  },
  {
    icon: ShieldCheck,
    title: 'NDA a signature electronique',
    body: "Avant d'acceder a la couche confidentielle, chaque acheteur signe un accord de confidentialite. Son identifiant, son adresse IP, son navigateur et l'horodatage sont conserves : la signature est nominative et datee.",
  },
  {
    icon: Lock,
    title: 'Messagerie sous filtre',
    body: "Les echanges de numeros, d'emails et les propositions de paiement hors plateforme sont bloques automatiquement. Objectif : eviter qu'un acheteur obtienne le contenu sans contrat ni paiement.",
  },
] as const;

export default function IdeaProtectionPage(): React.JSX.Element {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Protection des idees</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Une idee ne se protege pas comme un logo ou un brevet. Voici exactement ce que la plateforme
        garantit — et ce qu&apos;elle ne garantit pas.
      </p>

      <div className="mt-8 space-y-4">
        {MECHANISMS.map((mechanism) => (
          <Card key={mechanism.title}>
            <CardContent className="flex gap-4 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <mechanism.icon className="h-5 w-5 text-accent" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold">{mechanism.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {mechanism.body}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert variant="warning" className="mt-8">
        <AlertTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Ce que le certificat n&apos;est pas
        </AlertTitle>
        <AlertDescription className="mt-1.5 leading-relaxed">
          Le certificat d&apos;anteriorite est un element de preuve : il atteste qu&apos;un contenu
          precis existait a une date donnee et qu&apos;il a ete depose par vous. Ce n&apos;est ni un
          brevet, ni un depot de marque, ni un titre de propriete intellectuelle. Pour une invention
          brevetable ou une marque, effectuez un depot aupres de l&apos;OAPI (Afrique de l&apos;Ouest
          et centrale), de l&apos;INPI ou de l&apos;office competent de votre pays. En droit, une
          idee brute n&apos;est generalement pas protegeable en elle-meme : c&apos;est sa mise en
          forme, son dossier et son execution qui le sont.
        </AlertDescription>
      </Alert>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">En cas de litige</h2>
        <div className="prose-fr mt-3">
          <p>
            Si vous constatez qu&apos;un dossier depose reprend le votre, signalez-le depuis la fiche
            du projet ou par le formulaire de contact. Nous comparons les empreintes et les dates de
            depot : le premier horodatage fait foi dans notre registre.
          </p>
          <p>
            En cas de litige sur une transaction, l&apos;acheteur peut ouvrir un signalement depuis
            son espace. La plateforme intervient comme mediateur, avec le contrat de cession et les
            preuves d&apos;anteriorite comme pieces de reference.
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/vendre">Deposer mon idee</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Nous contacter</Link>
        </Button>
      </div>
    </div>
  );
}
