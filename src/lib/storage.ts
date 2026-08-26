import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isStorageConfigured, publicEnv } from '@/lib/env';
import { fileId } from '@/lib/hash';

/** Types de fichiers acceptes pour les pieces jointes d'un projet. */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

let cachedClient: SupabaseClient | null = null;

/** Client Supabase cote serveur (service role) — null si non configure. */
export function getStorageClient(): SupabaseClient | null {
  if (!isStorageConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL as string,
      env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false } },
    );
  }
  return cachedClient;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
  name: string;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/** Valide un fichier avant envoi (type MIME et taille). */
export function validateFile(file: { type: string; size: number; name: string }): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new StorageError(`Type de fichier non autorise : ${file.type || 'inconnu'}.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new StorageError('Fichier trop volumineux (10 Mo maximum).');
  }
  if (file.size === 0) {
    throw new StorageError('Fichier vide.');
  }
}

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80);
}

/**
 * Envoie un fichier dans Supabase Storage.
 * `visibility: 'private'` place le fichier dans un dossier non listable ;
 * l'acces se fait ensuite par URL signee, apres verification des droits.
 */
export async function uploadFile(
  file: File,
  options: { folder: string; visibility: 'public' | 'private' },
): Promise<UploadResult> {
  validateFile(file);

  const client = getStorageClient();
  if (!client) {
    throw new StorageError(
      "Le stockage de fichiers n'est pas configure (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const path = `${options.visibility}/${options.folder}/${fileId()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new StorageError(`Echec de l'envoi du fichier : ${error.message}`);

  const url =
    options.visibility === 'public'
      ? client.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
      : path; // les fichiers prives sont references par leur chemin

  return { url, path, size: file.size, type: file.type, name: file.name };
}

/** URL signee temporaire pour un fichier prive (defaut : 1 heure). */
export async function createSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const client = getStorageClient();
  if (!client) throw new StorageError("Le stockage de fichiers n'est pas configure.");

  const { data, error } = await client.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data) throw new StorageError(`Impossible de generer le lien : ${error?.message}`);
  return data.signedUrl;
}

/** Depose un document genere (contrat PDF) et renvoie son chemin de stockage. */
export async function uploadGeneratedPdf(bytes: Uint8Array, path: string): Promise<string> {
  const client = getStorageClient();
  if (!client) throw new StorageError("Le stockage de fichiers n'est pas configure.");

  const { error } = await client.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true });

  if (error) throw new StorageError(`Echec du depot du contrat : ${error.message}`);
  return path;
}

export async function deleteFile(path: string): Promise<void> {
  const client = getStorageClient();
  if (!client) return;
  await client.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([path]);
}
