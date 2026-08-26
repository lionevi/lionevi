import { Role } from '@prisma/client';
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Fingerprint,
  Lock,
  MapPin,
  MessageSquare,
  Star,
  Target,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AiScoreBadge } from '@/components/ai-score-badge';
import { BidPanel } from '@/components/bid-panel';
import { NdaGate } from '@/components/nda-gate';
import { SaveButton } from '@/components/save-button';
import { SimilarityBadge } from '@/components/similarity-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { anteriorityCertificateNumber, shortHash } from '@/lib/hash';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, formatNumber, truncate } from '@/lib/utils';
import { hasAtLeast, resolveProjectAccess } from '@/server/access';
import { getAuctionState } from '@/server/auctions';
import { NDA_TEXT } from '@/server/nda';
import { getProjectBySlug, incrementViews } from '@/server/projects';
import { getSessionUser } from '@/server/session';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    select: { title: true, ai_teaser: true, tagline: true, cover_image_url: true, status: true },
  });

  if (!project) return { title: 'Projet introuvable' };

  const description = truncate(project.ai_teaser ?? project.tagline, 155);

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      images: project.cover_image_url ? [project.cover_image_url] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const user = await getSessionUser();
  const access = await resolveProjectAccess(project, user);

  const isVisible = project.status === 'PUBLISHED' || project.status === 'SOLD';
  if (!isVisible && !access.is_owner && !access.is_admin) notFound();

  // Une vue n'est comptee que pour un visiteur exterieur.
  if (!access.is_owner && !access.is_admin) void incrementViews(project.id);

  const auction =
    project.selling_mode === 'AUCTION' ? await getAuctionState(project) : null;

  const saved = user
    ? await prisma.savedProject.findUnique({
        where: { user_id_project_id: { user_id: user.id, project_id: project.id } },
        select: { user_id: true },
      })
    : null;

  const sellerRatings = project.seller.reviews_received.map((review) => review.rating);
  const sellerRating =
    sellerRatings.length > 0
      ? sellerRatings.reduce((sum, value) => sum + value, 0) / sellerRatings.length
      : null;

  const price =
    project.selling_mode === 'FIXED_PRICE' ? project.fixed_price : project.auction_start_price;
  const isSold = project.status === 'SOLD';
  const canBuy =
    !isSold &&
    project.status === 'PUBLISHED' &&
    !access.is_owner &&
    project.selling_mode === 'FIXED_PRICE';

  return (
    <div className="container py-8">
      {/* Bandeaux d'etat */}
      {access.is_owner && project.status !== 'PUBLISHED' && (
        <Alert variant="warning" className="mb-6">
          <AlertDescription>
            Ce projet est en statut <strong>{project.status}</strong> : il n&apos;est pas visible
            publiquement. Vous le consultez en tant que proprietaire.
          </AlertDescription>
        </Alert>
      )}
      {isSold && (
        <Alert className="mb-6">
          <AlertDescription>
            Ce projet a ete vendu. Son dossier complet n&apos;est plus accessible a l&apos;achat.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Colonne principale */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{project.category}</Badge>
            <AiScoreBadge score={project.ai_score} level={project.display_level} />
            <SimilarityBadge status={project.similarity_status} />
            {project.selling_mode === 'AUCTION' && <Badge variant="secondary">Enchere</Badge>}
          </div>

          <h1 className="mt-3 text-balance font-display text-3xl font-bold leading-tight sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{project.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" aria-hidden />
              {formatNumber(project.views_count)} vues
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden />
              {formatNumber(project._count.nda_agreements)} NDA signes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" aria-hidden />
              Publie le {formatDate(project.created_at)}
            </span>
          </div>

          {project.cover_image_url && (
            <div className="card-media mt-6 aspect-[16/9] overflow-hidden rounded-xl">
              <img
                src={project.cover_image_url}
                alt={`Illustration du projet ${project.title}`}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {project.ai_teaser && (
            <Card className="mt-6 border-secondary/30 bg-secondary/5">
              <CardContent className="pt-6">
                <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-600">
                  Teaser genere par IA
                </p>
                <p className="mt-2 text-base leading-relaxed">{project.ai_teaser}</p>
              </CardContent>
            </Card>
          )}

          {/* Couche 1 — publique */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">Le probleme adresse</h2>
            <div className="prose-fr mt-3">
              {project.problem_statement.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Target className="h-5 w-5 text-primary" aria-hidden />
              Marche cible
            </h2>
            <div className="prose-fr mt-3">
              {project.target_market.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {project.sector_tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.sector_tags.map((tag) => (
                <Badge key={tag} variant="muted">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {project.video_url && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold">Presentation video</h2>
              <a
                href={project.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Voir la video de presentation
              </a>
            </section>
          )}

          <Separator className="my-10" />

          {/* Couche 2 — apres NDA */}
          <section>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold">Analyse confidentielle</h2>
              {hasAtLeast(access, 'NDA') ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Debloque
                </Badge>
              ) : (
                <Badge variant="muted">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  NDA requis
                </Badge>
              )}
            </div>

            {hasAtLeast(access, 'NDA') ? (
              <div className="mt-4 space-y-6">
                {project.executive_summary && (
                  <div>
                    <h3 className="font-display text-base font-semibold">Resume executif</h3>
                    <div className="prose-fr mt-2">
                      {project.executive_summary.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
                {project.market_size && (
                  <div>
                    <h3 className="font-display text-base font-semibold">Taille de marche estimee</h3>
                    <div className="prose-fr mt-2">
                      <p>{project.market_size}</p>
                    </div>
                  </div>
                )}
                {project.competitive_advantage && (
                  <div>
                    <h3 className="font-display text-base font-semibold">Avantage concurrentiel</h3>
                    <div className="prose-fr mt-2">
                      {project.competitive_advantage.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
                {project.similarity_note && (
                  <Alert variant="info">
                    <AlertDescription>
                      <strong>Note de differenciation du vendeur :</strong> {project.similarity_note}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <NdaGate
                  projectId={project.id}
                  ndaText={NDA_TEXT}
                  isAuthenticated={Boolean(user)}
                />
              </div>
            )}
          </section>

          <Separator className="my-10" />

          {/* Couche 3 — apres achat */}
          <section>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold">Dossier complet</h2>
              {hasAtLeast(access, 'OWNED') ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Debloque
                </Badge>
              ) : (
                <Badge variant="muted">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Reserve a l&apos;acquereur
                </Badge>
              )}
            </div>

            {hasAtLeast(access, 'OWNED') ? (
              <div className="mt-4 space-y-6">
                {project.full_description && (
                  <div>
                    <h3 className="font-display text-base font-semibold">Description complete</h3>
                    <div className="prose-fr mt-2">
                      {project.full_description.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
                {project.solution_detail && (
                  <div>
                    <h3 className="font-display text-base font-semibold">La solution</h3>
                    <div className="prose-fr mt-2">
                      {project.solution_detail.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
                {project.business_model && (
                  <div>
                    <h3 className="font-display text-base font-semibold">Modele economique</h3>
                    <div className="prose-fr mt-2">
                      {project.business_model.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
                {project.implementation_steps.length > 0 && (
                  <div>
                    <h3 className="font-display text-base font-semibold">Etapes de realisation</h3>
                    <ol className="mt-3 space-y-2.5">
                      {project.implementation_steps.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="text-sm leading-relaxed text-foreground/85">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {project.resources_identified && (
                  <div>
                    <h3 className="font-display text-base font-semibold">Ressources identifiees</h3>
                    <div className="prose-fr mt-2">
                      {project.resources_identified.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
                <Lock className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
                <h3 className="mt-3 font-display text-base font-semibold">
                  Le &laquo; comment &raquo; est reserve a l&apos;acquereur
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                  La solution detaillee, le modele economique, les etapes de realisation, les
                  ressources et les pieces jointes privees sont debloques a l&apos;achat, avec le
                  contrat de cession de droits.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Colonne laterale */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {auction ? (
            <BidPanel
              projectId={project.id}
              currency={project.currency}
              slug={project.slug}
              isAuthenticated={Boolean(user)}
              isOwner={access.is_owner}
              initial={{
                highest_bid: auction.highest_bid,
                bid_count: auction.bid_count,
                minimum_bid: auction.minimum_bid,
                reserve_met: auction.reserve_met,
                ends_at: auction.ends_at ? auction.ends_at.toISOString() : null,
                is_open: auction.is_open,
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix de vente</p>
                <p className="font-display text-3xl font-bold text-primary">
                  {price !== null ? formatCurrency(price, project.currency) : 'Sur demande'}
                </p>
                {canBuy ? (
                  <Button asChild className="mt-4 w-full" size="lg">
                    <Link href={`/projets/${project.slug}/paiement`}>Acheter ce projet</Link>
                  </Button>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {access.is_owner
                      ? 'Vous etes le vendeur de ce projet.'
                      : isSold
                        ? 'Ce projet a trouve preneur.'
                        : "Ce projet n'est pas disponible a l'achat."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <SaveButton
              projectId={project.id}
              initialSaved={Boolean(saved)}
              isAuthenticated={Boolean(user)}
            />
            {!access.is_owner && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/tableau-de-bord/messages?avec=${project.seller_id}`}>
                  <MessageSquare className="h-4 w-4" />
                  Contacter
                </Link>
              </Button>
            )}
          </div>

          {/* Anteriorite */}
          {project.content_hash && project.submitted_at && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Fingerprint className="h-4 w-4 text-accent" aria-hidden />
                  Preuve d&apos;anteriorite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Certificat</p>
                  <p className="font-mono text-xs font-semibold">
                    {anteriorityCertificateNumber(project.content_hash, project.submitted_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Empreinte SHA-256</p>
                  <p className="break-all font-mono text-xs">{shortHash(project.content_hash)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Depose le</p>
                  <p className="text-xs font-medium">{formatDate(project.submitted_at)}</p>
                </div>
                {access.is_owner && (
                  <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                    <a href={`/api/projects/${project.id}/certificat`}>
                      <FileText className="h-4 w-4" />
                      Telecharger le certificat
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estimations */}
          {(project.estimated_cost_min !== null || project.implementation_months !== null) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Mise en oeuvre estimee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {project.estimated_cost_min !== null && (
                  <div className="flex items-start gap-2.5">
                    <Banknote className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-xs text-muted-foreground">Budget de lancement</p>
                      <p className="font-medium">
                        {formatCurrency(project.estimated_cost_min, project.currency)}
                        {project.estimated_cost_max !== null &&
                          ` — ${formatCurrency(project.estimated_cost_max, project.currency)}`}
                      </p>
                    </div>
                  </div>
                )}
                {project.implementation_months !== null && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-xs text-muted-foreground">Duree estimee</p>
                      <p className="font-medium">{project.implementation_months} mois</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vendeur */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Le vendeur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/25 text-sm font-bold text-secondary-700">
                  {project.seller.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold">{project.seller.name}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {project.seller.country}
                    </span>
                    {sellerRating !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-secondary text-secondary" aria-hidden />
                        {sellerRating.toFixed(1)} ({sellerRatings.length})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {project.seller.bio && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {truncate(project.seller.bio, 180)}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Membre depuis {formatDate(project.seller.created_at)}
              </p>
            </CardContent>
          </Card>

          {user?.role === Role.ADMIN && (
            <Card className="border-warning/40 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Vue administrateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                <p>Statut : {project.status}</p>
                <p>Score IA : {project.ai_score ?? 'non evalue'}</p>
                <p>Similarite : {project.similarity_status ?? 'non analysee'}</p>
                <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                  <Link href="/admin/moderation">Ouvrir la moderation</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
