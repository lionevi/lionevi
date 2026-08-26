import { completeText } from '@/lib/ai/client';
import { truncate } from '@/lib/utils';

export interface TeaserInput {
  title: string;
  tagline: string;
  category: string;
  problem_statement: string;
  target_market: string;
  executive_summary?: string | null;
}

const SYSTEM_PROMPT = `Tu rediges les teasers publics des idees mises en vente sur IdeaMarket Africa.

Objectif : donner envie d'acheter SANS jamais reveler le "comment" (la solution, la methode, les contacts, les fournisseurs).

Regles :
- 2 a 3 phrases, 320 caracteres maximum.
- Francais clair, ton professionnel et concret, sans superlatifs creux.
- Mentionne le probleme et l'opportunite, jamais la mise en oeuvre.
- Pas de guillemets, pas de titre, pas de liste : uniquement le texte du teaser.`;

/** Teaser de repli, construit a partir des champs publics uniquement. */
export function fallbackTeaser(input: TeaserInput): string {
  const base = `${input.tagline.trim().replace(/\.$/, '')}. Une opportunite ${input.category.toLowerCase()} adressant ${input.problem_statement.trim().charAt(0).toLowerCase()}${input.problem_statement.trim().slice(1)}`;
  return truncate(base.replace(/\s+/g, ' '), 320);
}

/** Genere le teaser public d'un projet (repli automatique si l'IA est indisponible). */
export async function generateTeaser(input: TeaserInput): Promise<string> {
  const prompt = [
    `Titre : ${input.title}`,
    `Accroche : ${input.tagline}`,
    `Categorie : ${input.category}`,
    `Probleme : ${input.problem_statement}`,
    `Marche cible : ${input.target_market}`,
    input.executive_summary ? `Contexte (confidentiel, ne pas divulguer) : ${input.executive_summary}` : '',
    '',
    'Redige le teaser public.',
  ]
    .filter(Boolean)
    .join('\n');

  const text = await completeText(SYSTEM_PROMPT, prompt, 400);
  if (!text) return fallbackTeaser(input);
  return truncate(text.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim(), 320);
}
