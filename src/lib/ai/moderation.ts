import { z } from 'zod';
import { completeJson } from '@/lib/ai/client';

export interface ModerationResult {
  blocked: boolean;
  reason: string | null;
  categories: string[];
  engine: 'claude' | 'regles';
}

/**
 * Motifs bloques par regles : coordonnees directes echangees dans la messagerie.
 * Objectif : empecher la sortie de plateforme (et donc le contournement de
 * l'escrow et du contrat de cession), pas censurer la discussion.
 */
const CONTACT_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /(\+?\d[\d\s.-]{7,}\d)/, category: 'numero_de_telephone' },
  { pattern: /[\w.+-]+@[\w-]+\.[\w.]{2,}/i, category: 'adresse_email' },
  { pattern: /\b(whatsapp|telegram|signal|viber|wechat)\b/i, category: 'messagerie_externe' },
  { pattern: /\b(?:https?:\/\/|www\.)\S+/i, category: 'lien_externe' },
  { pattern: /\b(?:iban|rib)\b|\b[A-Z]{2}\d{2}[A-Z0-9]{10,}\b/i, category: 'coordonnees_bancaires' },
  {
    pattern: /\b(hors\s+(?:de\s+la\s+)?plateforme|en\s+dehors\s+du\s+site|paiement\s+direct|de\s+la\s+main\s+a\s+la\s+main)\b/i,
    category: 'contournement_plateforme',
  },
];

/** Filtre par regles, toujours applique (rapide, deterministe). */
export function ruleBasedModeration(content: string): ModerationResult {
  const categories = CONTACT_PATTERNS.filter(({ pattern }) => pattern.test(content)).map(
    ({ category }) => category,
  );

  if (categories.length === 0) {
    return { blocked: false, reason: null, categories: [], engine: 'regles' };
  }

  return {
    blocked: true,
    reason:
      "Ce message contient des coordonnees directes ou une proposition de transaction hors plateforme. Les echanges doivent rester sur IdeaMarket jusqu'a la signature du contrat de cession.",
    categories,
    engine: 'regles',
  };
}

const moderationSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().max(400).nullable(),
  categories: z.array(z.string()).max(5),
});

const SYSTEM_PROMPT = `Tu moderes la messagerie d'IdeaMarket Africa, une marketplace d'idees d'entreprise.

Bloque un message uniquement s'il :
- echange des coordonnees directes (telephone, email, reseau social, lien externe) ;
- propose de conclure la transaction hors de la plateforme ;
- contient du harcelement, des menaces, une arnaque manifeste ou une tentative d'extorsion ;
- tente d'obtenir gratuitement le contenu confidentiel protege par le NDA.

N'bloque PAS une negociation normale, une question technique, ou une demande de precision sur le projet.

Reponds UNIQUEMENT en JSON : {"blocked": true|false, "reason": "..."|null, "categories": ["..."]}
La raison est adressee a l'expediteur, en francais, en une phrase.`;

/**
 * Modere un message : regles d'abord (bloquant), puis analyse IA si disponible.
 * Un echec IA ne debloque jamais un message deja bloque par les regles.
 */
export async function moderateMessage(content: string): Promise<ModerationResult> {
  const ruleResult = ruleBasedModeration(content);
  if (ruleResult.blocked) return ruleResult;

  const aiResult = await completeJson({
    system: SYSTEM_PROMPT,
    prompt: `Message a moderer :\n"""\n${content}\n"""`,
    schema: moderationSchema,
    maxTokens: 400,
  });

  if (!aiResult) return ruleResult;

  return {
    blocked: aiResult.blocked,
    reason: aiResult.blocked
      ? (aiResult.reason ?? 'Ce message enfreint les regles de la messagerie IdeaMarket.')
      : null,
    categories: aiResult.categories,
    engine: 'claude',
  };
}
