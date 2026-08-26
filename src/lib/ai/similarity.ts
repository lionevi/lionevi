import { z } from 'zod';
import { completeJson } from '@/lib/ai/client';
import { normalizeText } from '@/lib/hash';
import { clamp } from '@/lib/utils';

export interface SimilarityCandidate {
  id: string;
  title: string;
  tagline: string;
  category: string;
  problem_statement: string;
  target_market: string;
  sector_tags: string[];
}

export interface SimilarityMatch {
  project_id: string;
  title: string;
  score: number;
  reason: string;
}

export interface SimilarityReport {
  max_score: number;
  matches: SimilarityMatch[];
  engine: 'claude' | 'lexical';
  analyzed_at: string;
}

/** Tokens significatifs d'un texte (mots de plus de 3 lettres, sans mots vides). */
const STOP_WORDS = new Set([
  'pour', 'avec', 'dans', 'les', 'des', 'une', 'aux', 'par', 'sur', 'que', 'qui',
  'plus', 'leur', 'sont', 'cette', 'ces', 'est', 'sans', 'chez', 'entre', 'afin',
  'nos', 'notre', 'votre', 'vers', 'tout', 'tous', 'toute', 'faire', 'permet',
  'ainsi', 'donc', 'mais', 'comme', 'elle', 'ils', 'nous', 'vous', 'ont', 'ete',
]);

export function tokenize(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(' ')
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word)),
  );
}

/** Indice de Jaccard entre deux ensembles de tokens, en pourcentage. */
export function jaccardScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

function candidateText(candidate: SimilarityCandidate): string {
  return [
    candidate.title,
    candidate.tagline,
    candidate.category,
    candidate.problem_statement,
    candidate.target_market,
    candidate.sector_tags.join(' '),
  ].join(' ');
}

/** Presetection lexicale : ne garde que les projets plausibles pour l'analyse IA. */
export function lexicalPrescreen(
  subject: SimilarityCandidate,
  candidates: SimilarityCandidate[],
  limit = 8,
): Array<{ candidate: SimilarityCandidate; score: number }> {
  const subjectTokens = tokenize(candidateText(subject));
  return candidates
    .filter((candidate) => candidate.id !== subject.id)
    .map((candidate) => ({
      candidate,
      score: jaccardScore(subjectTokens, tokenize(candidateText(candidate))),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const similaritySchema = z.object({
  matches: z.array(
    z.object({
      project_id: z.string().min(1),
      score: z.number().min(0).max(100),
      reason: z.string().min(1).max(500),
    }),
  ),
});

const SYSTEM_PROMPT = `Tu es charge du controle d'unicite chez IdeaMarket Africa.

On te donne une idee soumise et une liste d'idees deja publiees. Pour chaque idee de la liste, estime le pourcentage de similarite avec l'idee soumise.

Regles :
- 0-30 : idees distinctes (meme secteur ne suffit pas a creer de la similarite).
- 31-60 : chevauchement partiel (meme probleme, approche differente).
- 61-85 : forte similarite (meme probleme, meme approche, marche proche).
- 86-100 : doublon (idee substantiellement identique).
- Juge la SUBSTANCE (probleme + solution + marche), pas le vocabulaire.
- Justifie chaque score en une phrase, en francais.
- Reponds UNIQUEMENT avec un objet JSON valide : {"matches":[{"project_id":"...","score":0,"reason":"..."}]}`;

function buildPrompt(subject: SimilarityCandidate, candidates: SimilarityCandidate[]): string {
  const describe = (c: SimilarityCandidate): string =>
    [
      `id: ${c.id}`,
      `titre: ${c.title}`,
      `accroche: ${c.tagline}`,
      `categorie: ${c.category}`,
      `probleme: ${c.problem_statement}`,
      `marche: ${c.target_market}`,
    ].join('\n');

  return [
    'IDEE SOUMISE :',
    describe(subject),
    '',
    'IDEES DEJA PUBLIEES :',
    candidates.map((c, i) => `--- Candidat ${i + 1} ---\n${describe(c)}`).join('\n\n'),
  ].join('\n');
}

/**
 * Analyse de similarite : presetection lexicale puis verdict IA.
 * En l'absence d'IA, les scores lexicaux sont utilises tels quels.
 */
export async function analyzeSimilarity(
  subject: SimilarityCandidate,
  candidates: SimilarityCandidate[],
): Promise<SimilarityReport> {
  const analyzedAt = new Date().toISOString();
  const prescreened = lexicalPrescreen(subject, candidates);

  if (prescreened.length === 0) {
    return { max_score: 0, matches: [], engine: 'lexical', analyzed_at: analyzedAt };
  }

  const result = await completeJson({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(
      subject,
      prescreened.map((entry) => entry.candidate),
    ),
    schema: similaritySchema,
    maxTokens: 1500,
  });

  if (!result) {
    const matches: SimilarityMatch[] = prescreened
      .filter((entry) => entry.score > 0)
      .map((entry) => ({
        project_id: entry.candidate.id,
        title: entry.candidate.title,
        score: entry.score,
        reason: 'Similarite lexicale (analyse IA indisponible).',
      }));
    return {
      max_score: matches.reduce((max, m) => Math.max(max, m.score), 0),
      matches,
      engine: 'lexical',
      analyzed_at: analyzedAt,
    };
  }

  const byId = new Map(prescreened.map((entry) => [entry.candidate.id, entry.candidate]));
  const matches: SimilarityMatch[] = result.matches
    .filter((match) => byId.has(match.project_id))
    .map((match) => ({
      project_id: match.project_id,
      title: byId.get(match.project_id)?.title ?? 'Projet',
      score: clamp(Math.round(match.score), 0, 100),
      reason: match.reason,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    max_score: matches.reduce((max, m) => Math.max(max, m.score), 0),
    matches,
    engine: 'claude',
    analyzed_at: analyzedAt,
  };
}
