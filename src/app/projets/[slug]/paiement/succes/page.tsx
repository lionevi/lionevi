import { CheckCircle2, FileText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Achat confirme',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { slug: string };
}

export default async function CheckoutSuccessPage({ params }: PageProps): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect('/connexion');

  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    select: { id: true, title: true, slug: true },
  });
  if (!project) notFound();

  const transaction = await prisma.transaction.findFirst({
    where: { project_id: project.id, buyer_id: user.id },
    select: { id: true, status: true },
  });

  const completed = transaction?.status === 'COMPLETED';

  return (
    <div className="container flex min-h-[60vh] max-w-xl items-center py-12">
      <Card className="w-full">
        <CardContent className="pt-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
          </span>

          <h1 className="mt-5 font-display text-2xl font-bold">
            {completed ? 'Achat confirme' : 'Paiement en cours de confirmation'}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {completed
              ? `Le dossier complet de "${project.title}" est desormais accessible, et votre contrat de cession de droits a ete genere.`
              : `Nous attendons la confirmation de votre prestataire de paiement pour "${project.title}". Vous recevrez une notification des sa reception.`}
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`/projets/${project.slug}`}>Ouvrir le dossier</Link>
            </Button>
            {completed && transaction && (
              <Button asChild variant="outline">
                <a href={`/api/transactions/${transaction.id}/contrat`}>
                  <FileText className="h-4 w-4" />
                  Telecharger le contrat
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
