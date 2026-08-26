import { DisplayLevel, SimilarityStatus } from '@prisma/client';
import { AI_SCORE_THRESHOLDS, SIMILARITY_THRESHOLDS } from '@/lib/constants';
import { clamp } from '@/lib/utils';

/** Convertit un score IA (0-100) en niveau d'affichage. */
export function displayLevelFromScore(score: number): DisplayLevel {
  if (score >= AI_SCORE_THRESHOLDS.PREMIUM) return DisplayLevel.PREMIUM;
  if (score >= AI_SCORE_THRESHOLDS.FEATURED) return DisplayLevel.FEATURED;
  if (score >= AI_SCORE_THRESHOLDS.STANDARD) return DisplayLevel.STANDARD;
  return DisplayLevel.LOW;
}

/** Convertit un pourcentage de similarite (0-100) en statut. */
export function similarityStatusFromScore(score: number): SimilarityStatus {
  const value = clamp(score, 0, 100);
  if (value <= SIMILARITY_THRESHOLDS.CLEAR_MAX) return SimilarityStatus.CLEAR;
  if (value <= SIMILARITY_THRESHOLDS.MODERATE_MAX) return SimilarityStatus.MODERATE;
  if (value <= SIMILARITY_THRESHOLDS.HIGH_MAX) return SimilarityStatus.HIGH;
  return SimilarityStatus.DUPLICATE;
}

export interface DisplayLevelStyle {
  label: string;
  className: string;
}

/** Style du badge de score IA (couleurs du design system). */
export const DISPLAY_LEVEL_STYLES: Record<DisplayLevel, DisplayLevelStyle> = {
  PREMIUM: { label: 'Premium', className: 'bg-success/15 text-[#15803D] ring-1 ring-success/40' },
  FEATURED: { label: 'Featured', className: 'bg-primary/15 text-primary-600 ring-1 ring-primary/40' },
  STANDARD: { label: 'Standard', className: 'bg-muted text-muted-foreground ring-1 ring-border' },
  LOW: { label: 'Low', className: 'bg-error/10 text-error ring-1 ring-error/40' },
};

/** Ordre de tri des projets sur la marketplace : Premium d'abord. */
export const DISPLAY_LEVEL_WEIGHT: Record<DisplayLevel, number> = {
  PREMIUM: 4,
  FEATURED: 3,
  STANDARD: 2,
  LOW: 1,
};

/** Le prix de reserve reste cache : on n'expose que le fait qu'il soit atteint. */
export function isReserveMet(highestBid: number | null, reservePrice: number | null): boolean {
  if (reservePrice === null || reservePrice === undefined) return true;
  return (highestBid ?? 0) >= reservePrice;
}

/** Montant minimum acceptable pour une nouvelle enchere. */
export function minimumNextBid(
  startPrice: number,
  highestBid: number | null,
  incrementPercent: number,
): number {
  if (highestBid === null || highestBid === undefined) return startPrice;
  const increment = Math.max(1, Math.round((highestBid * incrementPercent) / 100));
  return highestBid + increment;
}
