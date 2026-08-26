import type { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/lib/api';
import { uploadFile } from '@/lib/storage';
import { AppError, requireUser } from '@/server/session';

export const runtime = 'nodejs';

/**
 * Envoi d'un fichier (image de couverture, piece jointe).
 * `visibility=private` reserve le fichier aux acheteurs du projet.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    await requireUser();

    const formData = await request.formData();
    const file = formData.get('file');
    const visibility = formData.get('visibility') === 'private' ? 'private' : 'public';
    const folder = String(formData.get('folder') ?? 'projets').replace(/[^a-z0-9/-]/gi, '');

    if (!(file instanceof File)) {
      throw new AppError('Aucun fichier recu.', 400, 'NO_FILE');
    }

    const result = await uploadFile(file, { folder: folder || 'projets', visibility });
    return ok({ file: result }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
