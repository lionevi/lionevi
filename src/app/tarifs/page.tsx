import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_PLATFORM_FEE_PERCENT, PAYMENT_METHOD_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Commissions et tarifs',
  description:
    "Le depot et l'evaluation sont gratuits sur IdeaMarket Africa. La plateforme ne se remunere qu'a la vente.",
};

const INCLUDED = [
  "Depot illimite de dossiers",
  "Empreinte SHA-256 et certificat d'anteriorite",
  "Controle d'unicite contre tous les projets publies",
  'Evaluation automatique sur six criteres',
  'Teaser public genere automatiquement',
  'NDA a signature electronique',
  'Messagerie moderee avec les acheteurs',
  'Contrat de cession de droits genere en PDF',
] as const;

export default function PricingPage(): React.JSX.Element {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Commissions et tarifs</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Aucun abonnement, aucun frais de depot. Nous ne gagnons que si vous vendez.
      </p>

      <Card className="mt-8 border-primary/40">
        <CardContent className="pt-8 text-center">
          <p className="font-display text-6xl font-extrabold text-primary">
            {DEFAULT_PLATFORM_FEE_PERCENT} %
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            preleves sur le prix de vente, uniquement lorsqu&apos;une cession est conclue
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed">
            Exemple : une idee vendue 500 000 FCFA vous rapporte 450 000 FCFA nets, credites sur
            votre portefeuille des l&apos;encaissement.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Inclus sans supplement</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Moyens de paiement acceptes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {Object.values(PAYMENT_METHOD_LABELS).map((label) => (
              <li key={label} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Les retraits vers Wave, Orange Money et MTN Mobile Money sont traites sous 48 heures
            ouvrees. Les frais eventuels de l&apos;operateur restent a la charge du beneficiaire.
          </p>
        </CardContent>
      </Card>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/vendre">Deposer une idee gratuitement</Link>
        </Button>
      </div>
    </div>
  );
}
