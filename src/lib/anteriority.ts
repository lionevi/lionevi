/**
 * Helpers d'anteriorite utilisables cote client comme cote serveur.
 *
 * Ce module ne depend d'aucune API Node : il peut etre importe depuis un
 * composant client. Le calcul d'empreinte lui-meme (qui utilise `node:crypto`)
 * vit dans `@/lib/hash`, cote serveur uniquement.
 */

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
 * Numero de certificat d'anteriorite lisible, derive du hash et de l'horodatage.
 * Format : IMA-<AAAA><MM>-<8 premiers caracteres du hash>.
 */
export function anteriorityCertificateNumber(
  contentHash: string,
  submittedAt: Date | string,
): string {
  const date = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  return `IMA-${year}${month}-${contentHash.slice(0, 8).toUpperCase()}`;
}

/** Empreinte courte affichable dans l'interface. */
export function shortHash(contentHash: string): string {
  return `${contentHash.slice(0, 12)}...${contentHash.slice(-4)}`;
}
