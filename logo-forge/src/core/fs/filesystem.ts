import { requireHostModule } from '@core/illustrator/host';

/** Sous-ensemble de `uxp.storage` utilise par le plugin. */
interface UxpEntry {
  name: string;
  isFolder: boolean;
  getEntry(path: string): Promise<UxpEntry>;
  createFolder(name: string): Promise<UxpEntry>;
  createFile(name: string, options?: { overwrite?: boolean }): Promise<UxpEntry>;
  write(data: string, options?: unknown): Promise<void>;
  nativePath?: string;
}

interface UxpStorage {
  localFileSystem: {
    getFolder(): Promise<UxpEntry>;
    getDataFolder(): Promise<UxpEntry>;
    createSessionToken(entry: UxpEntry): string;
  };
}

function storage(): UxpStorage['localFileSystem'] | null {
  const uxp = requireHostModule<{ storage: UxpStorage }>('uxp');
  return uxp?.storage.localFileSystem ?? null;
}

/** Ouvre le selecteur de dossier natif. `null` si l utilisateur annule. */
export async function pickOutputFolder(): Promise<UxpEntry | null> {
  const fs = storage();
  if (!fs) return null;
  try {
    return await fs.getFolder();
  } catch {
    return null;
  }
}

/**
 * Cree recursivement une arborescence a partir d un chemin POSIX relatif et
 * retourne le dossier final. Les dossiers deja presents sont reutilises.
 */
export async function ensureFolderPath(root: UxpEntry, relativePath: string): Promise<UxpEntry> {
  let current = root;
  for (const segment of relativePath.split('/').filter(Boolean)) {
    try {
      const existing = await current.getEntry(segment);
      current = existing.isFolder ? existing : await current.createFolder(segment);
    } catch {
      current = await current.createFolder(segment);
    }
  }
  return current;
}

export async function writeTextFile(
  root: UxpEntry,
  relativePath: string,
  contents: string,
): Promise<void> {
  const segments = relativePath.split('/').filter(Boolean);
  const fileName = segments.pop();
  if (!fileName) throw new Error(`Chemin de fichier invalide : « ${relativePath} ».`);
  const folder = await ensureFolderPath(root, segments.join('/'));
  const file = await folder.createFile(fileName, { overwrite: true });
  await file.write(contents);
}

export type { UxpEntry };
