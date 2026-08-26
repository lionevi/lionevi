import { createHash, randomUUID } from 'node:crypto';
import { normalizeText } from '@/lib/anteriority';

export { anteriorityCertificateNumber, normalizeText, shortHash } from '@/lib/anteriority';

/**
 * Champs pris en compte dans l'empreinte d'unicite d'un projet.
 * L'ordre est fige : il fait partie de la definition du hash et ne doit pas
 * changer, sous peine d'invalider les empreintes deja enregistrees.
 */
export interface HashableProject {
  title: string;
  tagline: string;
  category: string;
  problem_statement: string;
  target_market: string;
  executive_summary?: string | null;
  full_description?: string | null;
  solution_detail?: string | null;
  business_model?: string | null;
  implementation_steps?: string[] | null;
}

/**
 * Empreinte SHA-256 du contenu complet d'un projet.
 * Sert de preuve d'anteriorite : deux soumissions identiques produisent la
 * meme empreinte, ce qui permet de detecter un doublon exact instantanement.
 */
export function computeContentHash(project: HashableProject): string {
  const parts = [
    project.title,
    project.tagline,
    project.category,
    project.problem_statement,
    project.target_market,
    project.executive_summary ?? '',
    project.full_description ?? '',
    project.solution_detail ?? '',
    project.business_model ?? '',
    (project.implementation_steps ?? []).join(' '),
  ].map(normalizeText);

  return createHash('sha256').update(parts.join('|'), 'utf8').digest('hex');
}

/** Identifiant de fichier unique pour le stockage. */
export function fileId(): string {
  return randomUUID();
}

/** Hash SHA-256 generique (fichiers, pieces jointes). */
export function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}
