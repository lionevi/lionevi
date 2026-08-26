import { ArrowLeft, Eye, FileText, Fingerprint, Heart, Send } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProjectActions } from '@/app/tableau-de-bord/projets/[id]/project-actions';
import { AiScoreBadge } from '@/components/ai-score-badge';
import { SimilarityBadge } from '@/components/similarity-badge';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EVALUATION_CRITERIA, aiEvaluationSchema } from '@/lib/ai/evaluation';
import { anteriorityCertificateNumber } from '@/lib/anteriority';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gerer mon projet',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { id: string };
}

export default async function SellerProjectPage({ params }: PageProps): Promise<React.JSX.Element> {
  const user = await requireUser();

  const project = await prisma.project.findFirst({
    where: { id: params.id, seller_id: user.id },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 10,
        include: { bidder: { select: { name: true } } },
      },
      transaction: {
        select: { id: true, status: true, amount: true, seller_earnings: true, created_at: true },
      },
      _count: { select: { nda_agreements: true, saved_by: true } },
    },
  });

  if (!project) notFound();

  const evaluation = aiEvaluationSchema.safeParse(project.ai_evaluation);
  const similar = Array.isArray(project.similar_projects)
    ? (project.similar_projects as Array<{ project_id: string; title: string; score: number; reason: string }>)
    : [];

  return (
    <div>
      <Link
        href="/tableau-de-bord/projets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour a mes projets
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <AiScoreBadge score={project.ai_score} level={project.display_level} />
            <SimilarityBadge status={project.similarity_status} />
          </div>
          <h1 className="mt-2.5 font-display text-2xl font-bold">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.tagline}</p>
        </div>

        <ProjectActions
          projectId={project.id}
          slug={project.slug}
          status={project.status}
          hasBids={project.bids.length > 0}
        />
      </header>

      {project.status === 'REJECTED' && (
        <Alert variant="error" className="mt-6">
          <AlertTitle>Dossier refuse</AlertTitle>
          <AlertDescription>
            Corrigez votre dossier en suivant les recommandations ci-dessous, puis soumettez-le a
            nouveau. Votre empreinte d&apos;anteriorite initiale est conservee si le contenu reste
            identique.
          </AlertDescription>
        </Alert>
      )}

      {project.status === 'PENDING_REVIEW' && (
        <Alert variant="warning" className="mt-6">
          <AlertTitle>Validation manuelle en cours</AlertTitle>
          <AlertDescription>
            Notre equipe examine votre dossier. Vous serez notifie des la decision.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Vues', value: formatNumber(project.views_count), icon: Eye },
          { label: 'Favoris', value: formatNumber(project._count.saved_by), icon: Heart },
          { label: 'NDA signes', value: formatNumber(project._count.nda_agreements), icon: FileText },
          { label: 'Encheres', value: formatNumber(project.bids.length), icon: Send },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="mt-2 font-display text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Evaluation IA */}
      {evaluation.success && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Evaluation detaillee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {EVALUATION_CRITERIA.map((criterion) => {
                const entry = evaluation.data.scores[criterion.key];
                return (
                  <div key={criterion.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{criterion.label}</span>
                      <span className="text-sm font-bold tabular-nums">{entry.score}/100</span>
                    </div>
                    <Progress
                      value={entry.score}
                      className="mt-1.5"
                      indicatorClassName={
                        entry.score >= 80
                          ? 'bg-success'
                          : entry.score >= 60
                            ? 'bg-primary'
                            : entry.score >= 40
                              ? 'bg-warning'
                              : 'bg-error'
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{entry.comment}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <EvaluationList title="Points forts" items={evaluation.data.strengths} tone="success" />
              <EvaluationList title="Points faibles" items={evaluation.data.weaknesses} tone="warning" />
              <EvaluationList
                title="Recommandations"
                items={evaluation.data.recommendations}
                tone="default"
              />
            </div>

            {evaluation.data.suggested_price_range && (
              <Alert variant="info">
                <AlertDescription>
                  Fourchette de prix suggeree :{' '}
                  <strong>
                    {formatCurrency(evaluation.data.suggested_price_range.min, project.currency)} —{' '}
                    {formatCurrency(evaluation.data.suggested_price_range.max, project.currency)}
                  </strong>
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">
              {evaluation.data.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Similarite */}
      {similar.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Projets proches detectes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {similar.map((entry) => (
                <li key={entry.project_id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{entry.title}</span>
                    <Badge variant={entry.score > 60 ? 'warning' : 'muted'}>{entry.score}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.reason}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Anteriorite */}
      {project.content_hash && project.submitted_at && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-accent" aria-hidden />
              Preuve d&apos;anteriorite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Certificat : </span>
              <span className="font-mono font-semibold">
                {anteriorityCertificateNumber(project.content_hash, project.submitted_at)}
              </span>
            </p>
            <p className="break-all">
              <span className="text-muted-foreground">Empreinte SHA-256 : </span>
              <span className="font-mono text-xs">{project.content_hash}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Horodatage : </span>
              {formatDateTime(project.submitted_at)}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <a href={`/api/projects/${project.id}/certificat`}>
                <FileText className="h-4 w-4" />
                Telecharger le certificat
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Encheres */}
      {project.bids.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Offres recues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {project.bids.map((bid) => (
                <li key={bid.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-medium">{bid.bidder.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDateTime(bid.created_at)}
                    </span>
                  </span>
                  <span className="font-display font-bold text-primary">
                    {formatCurrency(bid.amount, project.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Transaction */}
      {project.transaction && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Vente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Statut : </span>
              {project.transaction.status}
            </p>
            <p>
              <span className="text-muted-foreground">Montant : </span>
              {formatCurrency(project.transaction.amount, project.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Net vendeur : </span>
              {formatCurrency(project.transaction.seller_earnings, project.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Date : </span>
              {formatDate(project.transaction.created_at)}
            </p>
            {project.transaction.status === 'COMPLETED' && (
              <Button asChild variant="outline" size="sm" className="mt-2">
                <a href={`/api/transactions/${project.transaction.id}/contrat`}>
                  <FileText className="h-4 w-4" />
                  Contrat de cession
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EvaluationList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'success' | 'warning' | 'default';
}): React.JSX.Element {
  const dotClass =
    tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-primary';

  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Aucun element.</p>
      )}
    </div>
  );
}
