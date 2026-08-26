import {
  DisplayLevel,
  NotificationType,
  ProjectStatus,
  SimilarityStatus,
  type Prisma,
  type Project,
} from '@prisma/client';
import { evaluateProject, type AiEvaluation } from '@/lib/ai/evaluation';
import { analyzeSimilarity, type SimilarityMatch } from '@/lib/ai/similarity';
import { generateTeaser } from '@/lib/ai/teaser';
import { MIN_PUBLISHABLE_AI_SCORE } from '@/lib/constants';
import { computeContentHash } from '@/lib/hash';
import { sendProjectPublishedEmail, sendProjectRejectedEmail } from '@/lib/email';
import { notify } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { displayLevelFromScore, similarityStatusFromScore } from '@/lib/scoring';
import { conflict } from '@/server/session';

export interface PipelineOutcome {
  project: Project;
  status: ProjectStatus;
  content_hash: string;
  submitted_at: Date;
  similarity_status: SimilarityStatus;
  similarity_max_score: number;
  similar_projects: SimilarityMatch[];
  ai_score: number;
  display_level: DisplayLevel;
  evaluation: AiEvaluation;
  teaser: string;
  /** Motif de refus ou de mise en attente, destine au vendeur. */
  message: string;
}

/**
 * Pipeline de soumission d'un projet.
 *
 * Ordre obligatoire, execute avant toute publication :
 *  1. empreinte SHA-256 du contenu complet et horodatage (registre d'anteriorite) ;
 *  2. detection de doublon exact (meme empreinte deja deposee) ;
 *  3. analyse de similarite avec les projets deja publies ;
 *  4. evaluation IA (score 0-100) et niveau d'affichage ;
 *  5. generation du teaser public ;
 *  6. decision de publication, notification et email.
 *
 * Le projet est passe en SIMILARITY_CHECK des le debut : en cas d'interruption,
 * son etat reste explicite et il peut etre relance.
 */
export async function runSubmissionPipeline(projectId: string): Promise<PipelineOutcome> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { seller: { select: { id: true, name: true, email: true } } },
  });

  if (!project) throw conflict('Projet introuvable.');
  if (project.status === ProjectStatus.SOLD) {
    throw conflict('Un projet vendu ne peut plus etre resoumis.');
  }
  if (project.status === ProjectStatus.PUBLISHED) {
    throw conflict('Ce projet est deja publie.');
  }

  // --- Etape 1 : empreinte et horodatage ---
  const contentHash = computeContentHash({
    title: project.title,
    tagline: project.tagline,
    category: project.category,
    problem_statement: project.problem_statement,
    target_market: project.target_market,
    executive_summary: project.executive_summary,
    full_description: project.full_description,
    solution_detail: project.solution_detail,
    business_model: project.business_model,
    implementation_steps: project.implementation_steps,
  });

  // L'horodatage d'anteriorite n'est pose qu'une fois : une resoumission ne
  // doit pas faire perdre au vendeur la date de son depot initial, sauf si le
  // contenu a change (empreinte differente).
  const submittedAt =
    project.submitted_at && project.content_hash === contentHash ? project.submitted_at : new Date();

  await prisma.project.update({
    where: { id: project.id },
    data: {
      content_hash: contentHash,
      submitted_at: submittedAt,
      status: ProjectStatus.SIMILARITY_CHECK,
    },
  });

  // --- Etape 2 : doublon exact ---
  const exactDuplicate = await prisma.project.findFirst({
    where: {
      content_hash: contentHash,
      id: { not: project.id },
      status: { in: [ProjectStatus.PUBLISHED, ProjectStatus.SOLD, ProjectStatus.PENDING_REVIEW] },
    },
    select: { id: true, title: true, submitted_at: true },
  });

  if (exactDuplicate) {
    const message =
      "Un dossier au contenu strictement identique a deja ete depose sur la plateforme. " +
      "Si vous en etes l'auteur, contactez le support avec votre certificat d'anteriorite.";

    const rejected = await finalize(project.id, {
      status: ProjectStatus.REJECTED,
      similarity_status: SimilarityStatus.DUPLICATE,
      similar_projects: [
        { project_id: exactDuplicate.id, title: exactDuplicate.title, score: 100, reason: 'Empreinte SHA-256 identique.' },
      ],
    });

    await announceRejection(project.seller, project.title, message);

    return {
      project: rejected,
      status: ProjectStatus.REJECTED,
      content_hash: contentHash,
      submitted_at: submittedAt,
      similarity_status: SimilarityStatus.DUPLICATE,
      similarity_max_score: 100,
      similar_projects: [
        { project_id: exactDuplicate.id, title: exactDuplicate.title, score: 100, reason: 'Empreinte SHA-256 identique.' },
      ],
      ai_score: 0,
      display_level: DisplayLevel.LOW,
      evaluation: {} as AiEvaluation,
      teaser: '',
      message,
    };
  }

  // --- Etape 3 : similarite ---
  const candidates = await prisma.project.findMany({
    where: {
      id: { not: project.id },
      status: { in: [ProjectStatus.PUBLISHED, ProjectStatus.SOLD] },
    },
    select: {
      id: true,
      title: true,
      tagline: true,
      category: true,
      problem_statement: true,
      target_market: true,
      sector_tags: true,
    },
    orderBy: { created_at: 'desc' },
    take: 200,
  });

  const similarity = await analyzeSimilarity(
    {
      id: project.id,
      title: project.title,
      tagline: project.tagline,
      category: project.category,
      problem_statement: project.problem_statement,
      target_market: project.target_market,
      sector_tags: project.sector_tags,
    },
    candidates,
  );

  const similarityStatus = similarityStatusFromScore(similarity.max_score);
  const relevantMatches = similarity.matches.filter((match) => match.score > 30).slice(0, 5);

  // --- Etape 4 : evaluation IA ---
  const evaluation = await evaluateProject({
    title: project.title,
    tagline: project.tagline,
    category: project.category,
    sector_tags: project.sector_tags,
    problem_statement: project.problem_statement,
    target_market: project.target_market,
    executive_summary: project.executive_summary,
    market_size: project.market_size,
    competitive_advantage: project.competitive_advantage,
    full_description: project.full_description,
    solution_detail: project.solution_detail,
    business_model: project.business_model,
    implementation_steps: project.implementation_steps,
    resources_identified: project.resources_identified,
    estimated_cost_min: project.estimated_cost_min,
    estimated_cost_max: project.estimated_cost_max,
    implementation_months: project.implementation_months,
    projected_revenue: project.projected_revenue,
    currency: project.currency,
  });

  const displayLevel = displayLevelFromScore(evaluation.global_score);

  // --- Etape 5 : teaser public ---
  const teaser = await generateTeaser({
    title: project.title,
    tagline: project.tagline,
    category: project.category,
    problem_statement: project.problem_statement,
    target_market: project.target_market,
    executive_summary: project.executive_summary,
  });

  // --- Etape 6 : decision ---
  let status: ProjectStatus;
  let message: string;

  if (similarityStatus === SimilarityStatus.DUPLICATE) {
    status = ProjectStatus.REJECTED;
    message =
      "Une idee substantiellement identique est deja en vente sur la plateforme. " +
      'Differenciez votre dossier avant de le resoumettre.';
  } else if (similarityStatus === SimilarityStatus.HIGH && !project.similarity_note) {
    status = ProjectStatus.PENDING_REVIEW;
    message =
      "Une forte similarite a ete detectee avec un projet existant. Ajoutez une note de " +
      'differenciation : votre dossier sera alors examine par notre equipe.';
  } else if (evaluation.global_score < MIN_PUBLISHABLE_AI_SCORE) {
    status = ProjectStatus.REJECTED;
    message =
      `Le score d'evaluation obtenu (${evaluation.global_score}/100) est insuffisant pour une ` +
      'publication. Completez votre dossier en suivant les recommandations puis resoumettez-le.';
  } else if (evaluation.verdict === 'REJETER' || similarityStatus === SimilarityStatus.HIGH) {
    status = ProjectStatus.PENDING_REVIEW;
    message =
      "Votre dossier est en attente de validation manuelle par notre equipe. " +
      'Vous serez notifie des la decision.';
  } else {
    status = ProjectStatus.PUBLISHED;
    message = 'Votre projet est publie sur la marketplace.';
  }

  const updated = await finalize(project.id, {
    status,
    similarity_status: similarityStatus,
    similar_projects: relevantMatches,
    ai_score: evaluation.global_score,
    ai_evaluation: evaluation as unknown as Prisma.InputJsonValue,
    ai_teaser: teaser,
    display_level: displayLevel,
  });

  // --- Notifications ---
  await notify({
    userId: project.seller_id,
    type: NotificationType.PROJECT_REVIEWED,
    title: 'Evaluation terminee',
    body: `"${project.title}" a obtenu un score de ${evaluation.global_score}/100.`,
    link: `/tableau-de-bord/projets/${project.id}`,
  });

  if (relevantMatches.length > 0) {
    await notify({
      userId: project.seller_id,
      type: NotificationType.SIMILARITY_ALERT,
      title: 'Similarite detectee',
      body: `${relevantMatches.length} projet(s) proche(s) identifie(s) — similarite maximale : ${similarity.max_score}%.`,
      link: `/tableau-de-bord/projets/${project.id}`,
    });
  }

  if (status === ProjectStatus.PUBLISHED) {
    await notify({
      userId: project.seller_id,
      type: NotificationType.PROJECT_PUBLISHED,
      title: 'Projet publie',
      body: `"${project.title}" est en ligne sur la marketplace.`,
      link: `/projets/${project.slug}`,
    });
    await sendProjectPublishedEmail(
      project.seller.email,
      project.title,
      project.slug,
      evaluation.global_score,
    );
  } else if (status === ProjectStatus.REJECTED) {
    await announceRejection(project.seller, project.title, message);
  } else {
    await notify({
      userId: project.seller_id,
      type: NotificationType.PROJECT_REVIEWED,
      title: 'Validation manuelle requise',
      body: message,
      link: `/tableau-de-bord/projets/${project.id}`,
    });
  }

  return {
    project: updated,
    status,
    content_hash: contentHash,
    submitted_at: submittedAt,
    similarity_status: similarityStatus,
    similarity_max_score: similarity.max_score,
    similar_projects: relevantMatches,
    ai_score: evaluation.global_score,
    display_level: displayLevel,
    evaluation,
    teaser,
    message,
  };
}

interface FinalizeData {
  status: ProjectStatus;
  similarity_status: SimilarityStatus;
  similar_projects: SimilarityMatch[];
  ai_score?: number;
  ai_evaluation?: Prisma.InputJsonValue;
  ai_teaser?: string;
  display_level?: DisplayLevel;
}

async function finalize(projectId: string, data: FinalizeData): Promise<Project> {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      status: data.status,
      similarity_status: data.similarity_status,
      similar_projects: data.similar_projects as unknown as Prisma.InputJsonValue,
      ...(data.ai_score !== undefined ? { ai_score: data.ai_score } : {}),
      ...(data.ai_evaluation !== undefined ? { ai_evaluation: data.ai_evaluation } : {}),
      ...(data.ai_teaser !== undefined ? { ai_teaser: data.ai_teaser } : {}),
      ...(data.display_level !== undefined ? { display_level: data.display_level } : {}),
    },
  });
}

async function announceRejection(
  seller: { id: string; email: string },
  projectTitle: string,
  reason: string,
): Promise<void> {
  await notify({
    userId: seller.id,
    type: NotificationType.PROJECT_REJECTED,
    title: 'Projet refuse',
    body: reason,
    link: '/tableau-de-bord/projets',
  });
  await sendProjectRejectedEmail(seller.email, projectTitle, reason);
}
