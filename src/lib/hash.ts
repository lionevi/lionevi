import { createHash, randomUUID } from 'node:crypto';

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

/** Normalise un texte : minuscules, sans accents, espaces reduits. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

/**
 * Numero de certificat d'anteriorite lisible, derive du hash et de l'horodatage.
 * Format : IMA-<AAAA><MM>-<8 premiers caracteres du hash>.
 */
export function anteriorityCertificateNumber(contentHash: string, submittedAt: Date): string {
  const year = submittedAt.getUTCFullYear();
  const month = `${submittedAt.getUTCMonth() + 1}`.padStart(2, '0');
  return `IMA-${year}${month}-${contentHash.slice(0, 8).toUpperCase()}`;
}

/** Empreinte courte affichable dans l'interface. */
export function shortHash(contentHash: string): string {
  return `${contentHash.slice(0, 12)}...${contentHash.slice(-4)}`;
}

/** Identifiant de fichier unique pour le stockage. */
export function fileId(): string {
  return randomUUID();
}

/** Hash SHA-256 generique (fichiers, pieces jointes). */
export function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}
