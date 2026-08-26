import type { DisplayLevel, PaymentMethod, SimilarityStatus } from '@prisma/client';

export const APP_NAME = 'IdeaMarket Africa';
export const APP_DESCRIPTION =
  "La marketplace des idees et projets innovants d'Afrique de l'Ouest. Vendez votre idee, achetez un projet pret a lancer.";

/** Commission plateforme par defaut (en %) — surchargable via PLATFORM_FEE_PERCENT. */
export const DEFAULT_PLATFORM_FEE_PERCENT = 10;

/** Incrementation minimale d'une enchere, en pourcentage du prix courant. */
export const MIN_BID_INCREMENT_PERCENT = 5;

/** Prolongation automatique si une enchere tombe dans les dernieres minutes. */
export const AUCTION_ANTI_SNIPE_MINUTES = 5;

export const CATEGORIES = [
  'Agriculture & Agroalimentaire',
  'Commerce & Distribution',
  'Education & Formation',
  'Energie & Environnement',
  'Fintech & Services financiers',
  'Sante & Bien-etre',
  'Logistique & Transport',
  'Immobilier & Construction',
  'Tourisme & Culture',
  'Technologie & Logiciels',
  'Industrie & Artisanat',
  'Medias & Divertissement',
  'Services aux entreprises',
  'Autre',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SECTOR_TAGS = [
  'B2B',
  'B2C',
  'Marketplace',
  'SaaS',
  'Mobile Money',
  'IA',
  'Economie circulaire',
  'Impact social',
  'Export',
  'Franchise',
  'Zone rurale',
  'Zone urbaine',
  'Faible capital',
  'Forte marge',
] as const;

export const COUNTRIES: Array<{ code: string; name: string; currency: string; dial: string }> = [
  { code: 'BJ', name: 'Benin', currency: 'XOF', dial: '+229' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', dial: '+226' },
  { code: 'CI', name: "Cote d'Ivoire", currency: 'XOF', dial: '+225' },
  { code: 'GN', name: 'Guinee', currency: 'GNF', dial: '+224' },
  { code: 'ML', name: 'Mali', currency: 'XOF', dial: '+223' },
  { code: 'NE', name: 'Niger', currency: 'XOF', dial: '+227' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', dial: '+221' },
  { code: 'TG', name: 'Togo', currency: 'XOF', dial: '+228' },
  { code: 'CM', name: 'Cameroun', currency: 'XAF', dial: '+237' },
  { code: 'GA', name: 'Gabon', currency: 'XAF', dial: '+241' },
  { code: 'FR', name: 'France', currency: 'EUR', dial: '+33' },
  { code: 'CA', name: 'Canada', currency: 'CAD', dial: '+1' },
  { code: 'US', name: 'Etats-Unis', currency: 'USD', dial: '+1' },
];

export const CURRENCIES = ['XOF', 'XAF', 'GNF', 'EUR', 'USD', 'CAD'] as const;

export const DISPLAY_LEVEL_LABELS: Record<DisplayLevel, string> = {
  PREMIUM: 'Premium',
  FEATURED: 'Featured',
  STANDARD: 'Standard',
  LOW: 'Low',
};

export const SIMILARITY_LABELS: Record<SimilarityStatus, string> = {
  CLEAR: 'Idee originale',
  MODERATE: 'Similarite moderee',
  HIGH: 'Similarite elevee',
  DUPLICATE: 'Doublon detecte',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  STRIPE: 'Carte bancaire',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOBILE_MONEY: 'MTN Mobile Money',
  WALLET: 'Portefeuille IdeaMarket',
};

/** Seuils de score IA -> niveau d'affichage. */
export const AI_SCORE_THRESHOLDS = {
  PREMIUM: 80,
  FEATURED: 60,
  STANDARD: 40,
} as const;

/** Seuils de similarite (en %). */
export const SIMILARITY_THRESHOLDS = {
  CLEAR_MAX: 30,
  MODERATE_MAX: 60,
  HIGH_MAX: 85,
} as const;

/** Score IA minimal pour qu'un projet soit publiable automatiquement. */
export const MIN_PUBLISHABLE_AI_SCORE = 25;
