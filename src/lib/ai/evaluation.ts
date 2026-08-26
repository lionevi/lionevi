import { z } from 'zod';
import { completeJson } from '@/lib/ai/client';
import { normalizeText } from '@/lib/hash';
import { clamp } from '@/lib/utils';

/** Criteres d'evaluation et leur poids dans le score global. */
export const EVALUATION_CRITERIA = [
  { key: 'originality', label: 'Originalite', weight: 0.2 },
  { key: 'feasibility', label: 'Faisabilite', weight: 0.2 },
  { key: 'market_potential', label: 'Potentiel de marche', weight: 0.2 },
  { key: 'economic_viability', label: 'Viabilite economique', weight: 0.15 },
  { key: 'clarity', label: 'Clarte et completude', weight: 0.15 },
  { key: 'local_relevance', label: 'Pertinence pour le marche africain', weight: 0.1 },
] as const;

export type EvaluationCriterionKey = (typeof EVALUATION_CRITERIA)[number]['key'];

const criterionSchema = z.object({
  score: z.number().min(0).max(100),
  comment: z.string().min(1).max(600),
});

export const aiEvaluationSchema = z.object({
  scores: z.object({
    originality: criterionSchema,
    feasibility: criterionSchema,
    market_potential: criterionSchema,
    economic_viability: criterionSchema,
    clarity: criterionSchema,
    local_relevance: criterionSchema,
  }),
  strengths: z.array(z.string().min(1)).min(1).max(5),
  weaknesses: z.array(z.string().min(1)).max(5),
  recommendations: z.array(z.string().min(1)).max(5),
  suggested_price_range: z
    .object({ min: z.number().nonnegative(), max: z.number().nonnegative() })
    .optional(),
  verdict: z.enum(['PUBLIER', 'A_AMELIORER', 'REJETER']),
  summary: z.string().min(1).max(1200),
});

export type AiEvaluation = z.infer<typeof aiEvaluationSchema> & {
  global_score: number;
  generated_at: string;
  engine: 'claude' | 'heuristique';
};

export interface EvaluationInput {
  title: string;
  tagline: string;
  category: string;
  sector_tags: string[];
  problem_statement: string;
  target_market: string;
  executive_summary?: string | null;
  market_size?: string | null;
  competitive_advantage?: string | null;
  full_description?: string | null;
  solution_detail?: string | null;
  business_model?: string | null;
  implementation_steps?: string[] | null;
  resources_identified?: string | null;
  estimated_cost_min?: number | null;
  estimated_cost_max?: number | null;
  implementation_months?: number | null;
  projected_revenue?: string | null;
  currency?: string;
}

const SYSTEM_PROMPT = `Tu es analyste senior chez IdeaMarket Africa, une marketplace ou des entrepreneurs vendent des idees et projets d'entreprise, principalement en Afrique de l'Ouest francophone.

Ta mission : evaluer objectivement la valeur commerciale d'une idee soumise a la vente.

Regles :
- Sois exigeant mais juste. Une idee vague et generique merite un score faible (< 40). Une idee precise, differenciee, realisable et documentee merite un score eleve (> 80).
- Prends en compte les realites du marche ouest-africain : pouvoir d'achat, mobile money, informel, logistique, acces a l'energie, cout du capital.
- Ne penalise pas une idee simple si elle est realisable et rentable ; penalise le manque de precision.
- Ecris tous les commentaires en francais, de maniere concrete et actionnable.
- Reponds UNIQUEMENT avec un objet JSON valide, sans texte autour.

Format JSON attendu :
{
  "scores": {
    "originality": { "score": 0-100, "comment": "..." },
    "feasibility": { "score": 0-100, "comment": "..." },
    "market_potential": { "score": 0-100, "comment": "..." },
    "economic_viability": { "score": 0-100, "comment": "..." },
    "clarity": { "score": 0-100, "comment": "..." },
    "local_relevance": { "score": 0-100, "comment": "..." }
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "suggested_price_range": { "min": 0, "max": 0 },
  "verdict": "PUBLIER" | "A_AMELIORER" | "REJETER",
  "summary": "..."
}`;

function buildPrompt(input: EvaluationInput): string {
  const currency = input.currency ?? 'XOF';
  const lines = [
    `Titre : ${input.title}`,
    `Accroche : ${input.tagline}`,
    `Categorie : ${input.category}`,
    `Tags : ${input.sector_tags.join(', ') || 'aucun'}`,
    '',
    `Probleme adresse :\n${input.problem_statement}`,
    `Marche cible :\n${input.target_market}`,
  ];
  if (input.executive_summary) lines.push(`Resume executif :\n${input.executive_summary}`);
  if (input.market_size) lines.push(`Taille de marche estimee :\n${input.market_size}`);
  if (input.competitive_advantage) lines.push(`Avantage concurrentiel :\n${input.competitive_advantage}`);
  if (input.full_description) lines.push(`Description complete :\n${input.full_description}`);
  if (input.solution_detail) lines.push(`Solution detaillee :\n${input.solution_detail}`);
  if (input.business_model) lines.push(`Modele economique :\n${input.business_model}`);
  if (input.implementation_steps?.length) {
    lines.push(`Etapes de realisation :\n${input.implementation_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  }
  if (input.resources_identified) lines.push(`Ressources identifiees :\n${input.resources_identified}`);
  if (input.estimated_cost_min != null || input.estimated_cost_max != null) {
    lines.push(
      `Cout estime : ${input.estimated_cost_min ?? '?'} - ${input.estimated_cost_max ?? '?'} ${currency}`,
    );
  }
  if (input.implementation_months != null) {
    lines.push(`Duree de mise en oeuvre : ${input.implementation_months} mois`);
  }
  if (input.projected_revenue) lines.push(`Revenus projetes :\n${input.projected_revenue}`);
  lines.push('', `Devise de reference pour la fourchette de prix suggeree : ${currency}.`);

  return `Evalue le projet suivant.\n\n${lines.join('\n')}`;
}

/** Moyenne ponderee des criteres, arrondie a une decimale. */
export function computeGlobalScore(scores: z.infer<typeof aiEvaluationSchema>['scores']): number {
  const total = EVALUATION_CRITERIA.reduce(
    (sum, criterion) => sum + scores[criterion.key].score * criterion.weight,
    0,
  );
  return Math.round(clamp(total, 0, 100) * 10) / 10;
}

/**
 * Evaluation de secours, sans appel IA : mesure la densite d'information fournie.
 * Volontairement conservatrice (plafonnee a 72) pour ne jamais accorder un badge
 * Premium sans analyse reelle.
 */
export function heuristicEvaluation(input: EvaluationInput): AiEvaluation {
  const wordCount = (value?: string | null): number =>
    value ? normalizeText(value).split(' ').filter(Boolean).length : 0;

  const depth = (words: number, target: number): number =>
    clamp(Math.round((words / target) * 100), 5, 100);

  const clarity = depth(
    wordCount(input.problem_statement) + wordCount(input.target_market) + wordCount(input.tagline),
    140,
  );
  const feasibility = depth(
    wordCount(input.solution_detail) + (input.implementation_steps?.length ?? 0) * 25,
    180,
  );
  const economic = depth(
    wordCount(input.business_model) +
      wordCount(input.projected_revenue) +
      (input.estimated_cost_max ? 40 : 0),
    150,
  );
  const market = depth(wordCount(input.market_size) + wordCount(input.target_market), 120);
  const originality = depth(wordCount(input.competitive_advantage) + wordCount(input.executive_summary), 130);
  const local = input.sector_tags.length > 0 ? 60 : 45;

  const scores = {
    originality: { score: originality, comment: "Estime a partir du niveau de detail de l'avantage concurrentiel." },
    feasibility: { score: feasibility, comment: 'Estime a partir de la precision de la solution et des etapes.' },
    market_potential: { score: market, comment: 'Estime a partir de la description du marche cible.' },
    economic_viability: { score: economic, comment: 'Estime a partir du modele economique fourni.' },
    clarity: { score: clarity, comment: 'Estime a partir de la completude des champs publics.' },
    local_relevance: { score: local, comment: 'Estime a partir des tags sectoriels renseignes.' },
  } satisfies z.infer<typeof aiEvaluationSchema>['scores'];

  const globalScore = Math.min(computeGlobalScore(scores), 72);

  return {
    scores,
    strengths: ['Dossier soumis avec les champs obligatoires renseignes.'],
    weaknesses: ["Evaluation automatique indisponible : analyse detaillee non realisee."],
    recommendations: [
      'Completer les sections solution, modele economique et etapes de realisation pour obtenir une evaluation complete.',
    ],
    verdict: globalScore >= 40 ? 'PUBLIER' : 'A_AMELIORER',
    summary:
      "Evaluation provisoire calculee sans analyse IA (service indisponible). Le score sera recalcule des que l'evaluation automatique redeviendra disponible.",
    global_score: globalScore,
    generated_at: new Date().toISOString(),
    engine: 'heuristique',
  };
}

/** Evalue un projet via Claude, avec repli heuristique en cas d'indisponibilite. */
export async function evaluateProject(input: EvaluationInput): Promise<AiEvaluation> {
  const result = await completeJson({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(input),
    schema: aiEvaluationSchema,
    maxTokens: 2500,
  });

  if (!result) return heuristicEvaluation(input);

  return {
    ...result,
    global_score: computeGlobalScore(result.scores),
    generated_at: new Date().toISOString(),
    engine: 'claude',
  };
}
