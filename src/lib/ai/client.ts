import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import { env, isAiConfigured } from '@/lib/env';

let cachedClient: Anthropic | null = null;

/** Client Anthropic partage (null si aucune cle n'est configuree). */
export function getAnthropicClient(): Anthropic | null {
  if (!isAiConfigured()) return null;
  if (!cachedClient) cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

/** Erreur levee lorsqu'une reponse IA est inexploitable. */
export class AiResponseError extends Error {
  constructor(
    message: string,
    readonly raw?: string,
  ) {
    super(message);
    this.name = 'AiResponseError';
  }
}

export interface CompleteJsonOptions<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  /** Nombre de tentatives en cas de reponse non parsable ou d'erreur reseau. */
  retries?: number;
}

/** Extrait le premier objet JSON complet d'une reponse texte. */
export function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i += 1) {
    const char = candidate[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof AiResponseError) return true;
  if (error instanceof Anthropic.RateLimitError) return true;
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIError) return error.status !== undefined && error.status >= 500;
  return false;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Appelle Claude et renvoie un objet JSON valide selon le schema fourni.
 * Renvoie `null` si l'IA n'est pas configuree — l'appelant doit alors basculer
 * sur son heuristique de secours.
 */
export async function completeJson<T>(options: CompleteJsonOptions<T>): Promise<T | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const { system, prompt, schema, maxTokens = 2000, retries = 2 } = options;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await client.messages.create({
        model: env.ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      const json = extractJson(text);
      if (!json) throw new AiResponseError('Reponse IA sans objet JSON exploitable.', text);

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(json);
      } catch {
        throw new AiResponseError('JSON invalide dans la reponse IA.', json);
      }

      const parsed = schema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new AiResponseError(
          `Reponse IA hors schema : ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
          json,
        );
      }
      return parsed.data;
    } catch (error) {
      lastError = error;
      if (attempt < retries && isRetryable(error)) {
        await sleep(2 ** attempt * 500);
        continue;
      }
      break;
    }
  }

  console.error('[ai] echec de l appel Claude :', lastError);
  return null;
}

/** Appel texte simple (teaser, reformulation). */
export async function completeText(
  system: string,
  prompt: string,
  maxTokens = 600,
): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    return text || null;
  } catch (error) {
    console.error('[ai] echec de l appel texte Claude :', error);
    return null;
  }
}
