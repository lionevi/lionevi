import { Fingerprint, Layers, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SellWizard } from '@/app/vendre/sell-wizard';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vendre une idee',
  description:
    "Deposez votre idee sur IdeaMarket Africa : empreinte SHA-256, controle d'unicite, evaluation IA et mise en vente.",
};

const PRINCIPLES = [
  {
    icon: Fingerprint,
    title: 'Votre anteriorite est scellee',
    body: 'Des la soumission, votre dossier recoit une empreinte SHA-256 horodatee et un numero de certificat.',
  },
  {
    icon: Layers,
    title: 'Trois couches de divulgation',
    body: "Le public voit le probleme, l'acheteur sous NDA voit l'analyse, l'acquereur seul obtient le comment.",
  },
  {
    icon: Sparkles,
    title: 'Evaluation automatique',
    body: 'Six criteres notes par IA determinent votre score, votre badge et votre position dans les resultats.',
  },
] as const;

export default async function SellPage({
  searchParams,
}: {
  searchParams: { projet?: string };
}): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect('/connexion?callbackUrl=/vendre');

  // Reprise d'un brouillon existant.
  const draft = searchParams.projet
    ? await prisma.project.findFirst({
        where: {
          id: searchParams.projet,
          seller_id: user.id,
          status: { in: ['DRAFT', 'REJECTED', 'PENDING_REVIEW'] },
        },
      })
    : null;

  return (
    <div className="container py-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold">
          {draft ? 'Reprendre votre dossier' : 'Deposer votre idee'}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Plus votre dossier est precis, plus votre score d&apos;evaluation est eleve — et plus
          votre idee se vend cher.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {PRINCIPLES.map((principle) => (
          <div key={principle.title} className="rounded-xl border border-border bg-card p-4">
            <principle.icon className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="mt-2.5 font-display text-sm font-semibold">{principle.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{principle.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <SellWizard
          initialProject={
            draft
              ? {
                  id: draft.id,
                  title: draft.title,
                  tagline: draft.tagline,
                  category: draft.category,
                  sector_tags: draft.sector_tags,
                  problem_statement: draft.problem_statement,
                  target_market: draft.target_market,
                  cover_image_url: draft.cover_image_url ?? '',
                  executive_summary: draft.executive_summary ?? '',
                  market_size: draft.market_size ?? '',
                  competitive_advantage: draft.competitive_advantage ?? '',
                  full_description: draft.full_description ?? '',
                  solution_detail: draft.solution_detail ?? '',
                  business_model: draft.business_model ?? '',
                  implementation_steps: draft.implementation_steps,
                  resources_identified: draft.resources_identified ?? '',
                  video_url: draft.video_url ?? '',
                  estimated_cost_min: draft.estimated_cost_min ?? undefined,
                  estimated_cost_max: draft.estimated_cost_max ?? undefined,
                  implementation_months: draft.implementation_months ?? undefined,
                  projected_revenue: draft.projected_revenue ?? '',
                  selling_mode: draft.selling_mode,
                  fixed_price: draft.fixed_price ?? undefined,
                  auction_start_price: draft.auction_start_price ?? undefined,
                  auction_reserve_price: draft.auction_reserve_price ?? undefined,
                  auction_end_date: draft.auction_end_date
                    ? draft.auction_end_date.toISOString().slice(0, 16)
                    : '',
                  currency: draft.currency,
                  similarity_note: draft.similarity_note ?? '',
                }
              : null
          }
        />
      </div>
    </div>
  );
}
