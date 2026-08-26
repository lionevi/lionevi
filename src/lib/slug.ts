import { prisma } from '@/lib/prisma';

/** Transforme un titre en slug URL sur (sans accents, sans caracteres speciaux). */
export function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return base || 'projet';
}

/**
 * Genere un slug unique en base : ajoute un suffixe numerique en cas de collision.
 * `excludeId` permet de conserver son propre slug lors d'une mise a jour.
 */
export async function uniqueProjectSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
