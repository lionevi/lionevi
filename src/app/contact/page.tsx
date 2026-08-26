import { LifeBuoy, Mail, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Contacter l'equipe IdeaMarket Africa : support, signalement, partenariats.",
};

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'Support utilisateurs',
    body: "Une question sur un depot, un paiement ou un retrait ? Ecrivez a support@ideamarket.africa. Reponse sous 48 heures ouvrees.",
  },
  {
    icon: ShieldAlert,
    title: 'Signalement',
    body: "Vous constatez qu'un dossier reprend le votre, ou un comportement abusif ? Ecrivez a signalement@ideamarket.africa en joignant votre numero de certificat d'anteriorite.",
  },
  {
    icon: Mail,
    title: 'Partenariats et presse',
    body: "Incubateurs, fonds, medias : contact@ideamarket.africa.",
  },
] as const;

export default function ContactPage(): React.JSX.Element {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold">Nous contacter</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Une equipe reduite, des reponses rapides. Choisissez le bon canal pour aller plus vite.
      </p>

      <div className="mt-8 space-y-4">
        {CHANNELS.map((channel) => (
          <Card key={channel.title}>
            <CardContent className="flex gap-4 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <channel.icon className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold">{channel.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {channel.body}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Si votre question porte sur la protection des dossiers, consultez d&apos;abord la page{' '}
        <Link href="/protection-des-idees" className="font-medium text-primary hover:underline">
          protection des idees
        </Link>
        .
      </p>
    </div>
  );
}
