/**
 * Acces centralise et valide aux variables d'environnement.
 *
 * Les variables strictement necessaires au demarrage sont validees a l'import.
 * Les variables optionnelles (integrations externes) sont exposees via des
 * helpers `isXxxConfigured()` afin que l'application reste fonctionnelle en
 * mode degrade lorsqu'un service tiers n'est pas configure.
 */
import { z } from 'zod';

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET doit faire au moins 16 caracteres'),
  AUTH_URL: z.string().url().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('IdeaMarket Africa <no-reply@ideamarket.africa>'),

  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('ideamarket'),

  WAVE_API_KEY: z.string().optional(),
  ORANGE_MONEY_API_KEY: z.string().optional(),
  MTN_MOMO_API_KEY: z.string().optional(),

  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(50).default(10),
  CRON_SECRET: z.string().optional(),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type PublicEnv = z.infer<typeof publicSchema>;

function parseServerEnv(): ServerEnv {
  // Pendant `next build`, les pages sont analysees sans acces aux secrets de
  // production : on tolere l'absence de valeurs et on echoue au runtime.
  const parsed = serverSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  if (process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION !== 'true') {
    const details = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuration d'environnement invalide :\n${details}`);
  }

  return serverSchema.parse({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/ideamarket',
    AUTH_SECRET: process.env.AUTH_SECRET ?? 'dev-secret-non-securise-a-remplacer',
  });
}

export const env: ServerEnv = parseServerEnv();

export const publicEnv: PublicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});

export const isAiConfigured = (): boolean => Boolean(env.ANTHROPIC_API_KEY);
export const isStripeConfigured = (): boolean => Boolean(env.STRIPE_SECRET_KEY);
export const isEmailConfigured = (): boolean => Boolean(env.RESEND_API_KEY);
export const isGoogleAuthConfigured = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const isStorageConfigured = (): boolean =>
  Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
