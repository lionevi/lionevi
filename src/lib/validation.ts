import { z } from 'zod';
import { CATEGORIES, CURRENCIES } from '@/lib/constants';

const requiredText = (min: number, max: number, field: string) =>
  z
    .string({ required_error: `${field} est obligatoire.` })
    .trim()
    .min(min, `${field} doit contenir au moins ${min} caracteres.`)
    .max(max, `${field} ne doit pas depasser ${max} caracteres.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Ce champ ne doit pas depasser ${max} caracteres.`)
    .optional()
    .or(z.literal('').transform(() => undefined));

// --- Authentification ---

export const registerSchema = z
  .object({
    name: requiredText(2, 80, 'Le nom'),
    email: z.string().trim().toLowerCase().email('Adresse email invalide.'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caracteres.')
      .max(128, 'Le mot de passe est trop long.')
      .regex(/[a-zA-Z]/, 'Le mot de passe doit contenir au moins une lettre.')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.'),
    confirmPassword: z.string(),
    country: z.string().length(2, 'Selectionnez un pays.').default('BJ'),
    role: z.enum(['SELLER', 'BUYER', 'BOTH']).default('BOTH'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

export const profileSchema = z.object({
  name: requiredText(2, 80, 'Le nom'),
  bio: optionalText(600),
  country: z.string().length(2),
  phone: optionalText(24),
  avatar_url: z.string().url('URL invalide.').optional().or(z.literal('').transform(() => undefined)),
});

// --- Projets ---

export const attachmentSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  type: z.string().min(1).max(120),
  size: z.number().int().nonnegative(),
  is_private: z.boolean().default(true),
});

export type AttachmentInput = z.infer<typeof attachmentSchema>;

const baseProjectSchema = z.object({
  // Couche 1 — publique
  title: requiredText(8, 120, 'Le titre'),
  tagline: requiredText(15, 180, "L'accroche"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Selectionnez une categorie.' }) }),
  sector_tags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  problem_statement: requiredText(60, 2000, 'Le probleme adresse'),
  target_market: requiredText(40, 1500, 'Le marche cible'),
  cover_image_url: z.string().url().optional().or(z.literal('').transform(() => undefined)),

  // Couche 2 — apres NDA
  executive_summary: requiredText(100, 3000, 'Le resume executif'),
  market_size: optionalText(1200),
  competitive_advantage: requiredText(60, 2000, "L'avantage concurrentiel"),

  // Couche 3 — apres achat
  full_description: requiredText(200, 12000, 'La description complete'),
  solution_detail: requiredText(150, 8000, 'La solution detaillee'),
  business_model: requiredText(100, 6000, 'Le modele economique'),
  implementation_steps: z
    .array(z.string().trim().min(5, 'Chaque etape doit etre explicite.').max(500))
    .min(3, 'Indiquez au moins 3 etapes de realisation.')
    .max(20),
  resources_identified: optionalText(4000),

  // Medias
  images: z.array(z.string().url()).max(8).default([]),
  attachments: z.array(attachmentSchema).max(10).default([]),
  video_url: z
    .string()
    .url()
    .refine(
      (url) => /youtube\.com|youtu\.be|vimeo\.com/i.test(url),
      'Seuls YouTube et Vimeo sont acceptes.',
    )
    .optional()
    .or(z.literal('').transform(() => undefined)),

  // Estimation financiere
  estimated_cost_min: z.number().nonnegative().optional(),
  estimated_cost_max: z.number().nonnegative().optional(),
  implementation_months: z.number().int().min(1).max(120).optional(),
  projected_revenue: optionalText(2000),

  // Mode de vente
  selling_mode: z.enum(['FIXED_PRICE', 'AUCTION']),
  fixed_price: z.number().positive().optional(),
  auction_start_price: z.number().positive().optional(),
  auction_reserve_price: z.number().positive().optional(),
  auction_end_date: z.coerce.date().optional(),
  currency: z.enum(CURRENCIES).default('XOF'),

  // Note de differenciation (renseignee si similarite detectee)
  similarity_note: optionalText(2000),
});

/** Regles croisees communes a la creation et a la mise a jour d'un projet. */
export const projectSchema = baseProjectSchema
  .refine(
    (data) =>
      data.estimated_cost_min === undefined ||
      data.estimated_cost_max === undefined ||
      data.estimated_cost_min <= data.estimated_cost_max,
    { message: 'Le cout minimum doit etre inferieur au cout maximum.', path: ['estimated_cost_max'] },
  )
  .refine((data) => data.selling_mode !== 'FIXED_PRICE' || data.fixed_price !== undefined, {
    message: 'Indiquez un prix de vente.',
    path: ['fixed_price'],
  })
  .refine((data) => data.selling_mode !== 'AUCTION' || data.auction_start_price !== undefined, {
    message: 'Indiquez un prix de depart.',
    path: ['auction_start_price'],
  })
  .refine((data) => data.selling_mode !== 'AUCTION' || data.auction_end_date !== undefined, {
    message: 'Indiquez une date de fin des encheres.',
    path: ['auction_end_date'],
  })
  .refine(
    (data) =>
      data.selling_mode !== 'AUCTION' ||
      data.auction_end_date === undefined ||
      data.auction_end_date.getTime() > Date.now() + 60 * 60 * 1000,
    { message: "L'enchere doit durer au moins une heure.", path: ['auction_end_date'] },
  )
  .refine(
    (data) =>
      data.selling_mode !== 'AUCTION' ||
      data.auction_reserve_price === undefined ||
      data.auction_start_price === undefined ||
      data.auction_reserve_price >= data.auction_start_price,
    {
      message: 'Le prix de reserve doit etre superieur ou egal au prix de depart.',
      path: ['auction_reserve_price'],
    },
  );

export type ProjectInput = z.infer<typeof projectSchema>;

/** Brouillon : seuls le titre et la categorie sont exiges. */
export const draftProjectSchema = baseProjectSchema.partial().extend({
  title: requiredText(3, 120, 'Le titre'),
  category: z.enum(CATEGORIES),
});

export type DraftProjectInput = z.infer<typeof draftProjectSchema>;

// --- Encheres, messages, transactions ---

export const bidSchema = z.object({
  project_id: z.string().cuid(),
  amount: z.number().positive('Le montant doit etre superieur a zero.'),
});

export const messageSchema = z.object({
  receiver_id: z.string().cuid(),
  project_id: z.string().cuid().optional(),
  content: requiredText(1, 4000, 'Le message'),
});

export const ndaSchema = z.object({
  project_id: z.string().cuid(),
  accepted: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les termes du NDA.' }),
  }),
});

export const checkoutSchema = z.object({
  project_id: z.string().cuid(),
  payment_method: z.enum(['STRIPE', 'WAVE', 'ORANGE_MONEY', 'MTN_MOBILE_MONEY', 'WALLET']),
  phone: optionalText(24),
});

export const reviewSchema = z.object({
  transaction_id: z.string().cuid(),
  rating: z.number().int().min(1, 'Note minimale : 1.').max(5, 'Note maximale : 5.'),
  comment: optionalText(1000),
});

export const withdrawalSchema = z.object({
  amount: z.number().positive('Le montant doit etre superieur a zero.'),
  method: z.enum(['WAVE', 'ORANGE_MONEY', 'MTN_MOBILE_MONEY']),
  phone: requiredText(6, 24, 'Le numero de telephone'),
});

export const adminReviewSchema = z.object({
  project_id: z.string().cuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: optionalText(1000),
});

/** Filtres de la marketplace (query string). */
export const projectFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categorie: z.string().trim().max(80).optional(),
  mode: z.enum(['FIXED_PRICE', 'AUCTION']).optional(),
  niveau: z.enum(['PREMIUM', 'FEATURED', 'STANDARD', 'LOW']).optional(),
  prix_min: z.coerce.number().nonnegative().optional(),
  prix_max: z.coerce.number().nonnegative().optional(),
  tri: z.enum(['recent', 'score', 'prix_asc', 'prix_desc', 'populaire']).default('score'),
  page: z.coerce.number().int().min(1).default(1),
});

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
