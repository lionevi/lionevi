import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CheckoutForm } from '@/app/projets/[slug]/paiement/checkout-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isStripeConfigured } from '@/lib/env';
import { computeFees } from '@/lib/payments/fees';
import { providersForCountry } from '@/lib/payments/mobile-money';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { resolvePurchasePrice } from '@/server/transactions';
import { getSessionUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Paiement',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { slug: string };
  searchParams: { annule?: string };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect(`/connexion?callbackUrl=/projets/${params.slug}/paiement`);

  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: { seller: { select: { name: true } } },
  });
  if (!project) notFound();

  if (project.seller_id === user.id) redirect(`/projets/${project.slug}`);
  if (project.status === 'SOLD') redirect(`/projets/${project.slug}`);

  // Verifie l'eligibilite : prix fixe ouvert a tous, enchere reservee au gagnant.
  let amount: number;
  try {
    amount = await resolvePurchasePrice(project.id, user.id);
  } catch {
    redirect(`/projets/${project.slug}`);
  }

  const fees = computeFees(amount, project.currency);
  const buyer = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { wallet_balance: true, country: true, phone: true },
  });

  const mobileMoneyProviders = providersForCountry(buyer.country).map((provider) => ({
    method: provider.method,
    label: provider.label,
  }));

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-display text-3xl font-bold">Finaliser l&apos;acquisition</h1>
      <p className="mt-1.5 text-muted-foreground">
        Vous etes sur le point d&apos;acquerir les droits sur &laquo; {project.title} &raquo;.
      </p>

      {searchParams.annule && (
        <Alert variant="warning" className="mt-6">
          <AlertDescription>
            Le paiement a ete interrompu. Aucun montant n&apos;a ete debite : vous pouvez
            reessayer.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <Row label="Projet" value={project.title} />
          <Row label="Vendeur" value={project.seller.name} />
          <Row
            label="Mode de vente"
            value={project.selling_mode === 'AUCTION' ? 'Enchere remportee' : 'Prix fixe'}
          />
          <div className="border-t border-border pt-2.5">
            <Row
              label="Montant a regler"
              value={formatCurrency(fees.amount, project.currency)}
              strong
            />
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            La commission de {fees.fee_percent} % est prelevee sur la part du vendeur : le montant
            affiche est bien celui que vous reglez.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6">
        <CheckoutForm
          projectId={project.id}
          projectSlug={project.slug}
          amount={fees.amount}
          currency={project.currency}
          walletBalance={buyer.wallet_balance}
          defaultPhone={buyer.phone ?? ''}
          stripeEnabled={isStripeConfigured()}
          mobileMoneyProviders={mobileMoneyProviders}
        />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
        <p className="text-sm leading-relaxed text-foreground/80">
          Des l&apos;encaissement, le dossier complet est debloque et un contrat de cession de
          droits est genere a votre nom, mentionnant l&apos;empreinte SHA-256 du depot et sa date.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'font-display text-xl font-bold text-primary' : 'font-medium'}>
        {value}
      </span>
    </div>
  );
}
