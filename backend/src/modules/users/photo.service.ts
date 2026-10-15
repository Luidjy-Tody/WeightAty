import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { validationError } from '../../utils/http-error.js';

/** Taille maximale acceptée pour une photo de profil (2 Mo). */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Types MIME acceptés et extension de fichier correspondante. */
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/** Préfixe d'URL public des photos. */
const PHOTO_URL_PREFIX = '/uploads/avatars/';

/**
 * Racine du stockage des fichiers (hors dépôt Git, cf. `.gitignore`).
 * Configurable via `UPLOAD_ROOT` pour un déploiement avec volume dédié.
 */
export const UPLOAD_ROOT = process.env['UPLOAD_ROOT'] ?? join(process.cwd(), 'uploads');

/** Dossier des photos de profil. */
const UPLOAD_DIR = join(UPLOAD_ROOT, 'avatars');

/** Vérifie la signature binaire d'un JPEG (FF D8 FF). */
function isJpeg(buffer: Buffer): boolean {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

/** Vérifie la signature binaire d'un PNG (89 50 4E 47). */
function isPng(buffer: Buffer): boolean {
  return (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}

/**
 * Enregistre une photo de profil à partir de son contenu base64.
 * Valide le type MIME déclaré, la signature binaire réelle et la taille,
 * puis renvoie l'URL publique à stocker en base.
 */
export async function saveProfilePhoto(base64: string, mimeType: string): Promise<string> {
  const extension = ALLOWED_MIME_TYPES[mimeType];

  if (!extension) {
    throw validationError({ photo: "Format d'image non pris en charge (JPG ou PNG attendu)." });
  }

  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length === 0) {
    throw validationError({ photo: "L'image est illisible." });
  }

  if (buffer.length > MAX_PHOTO_BYTES) {
    throw validationError({
      photo: `L'image ne doit pas dépasser ${MAX_PHOTO_BYTES / (1024 * 1024)} Mo.`,
    });
  }

  const signatureValid = mimeType === 'image/jpeg' ? isJpeg(buffer) : isPng(buffer);

  if (!signatureValid) {
    throw validationError({ photo: "Le fichier ne correspond pas au format annoncé." });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  await writeFile(join(UPLOAD_DIR, fileName), buffer);

  return `${PHOTO_URL_PREFIX}${fileName}`;
}

/**
 * Supprime le fichier d'une photo de profil (au mieux).
 * Le nom de fichier est validé pour empêcher toute traversée de répertoire.
 */
export async function deleteProfilePhotoFile(photoUrl: string | null): Promise<void> {
  if (!photoUrl || !photoUrl.startsWith(PHOTO_URL_PREFIX)) {
    return;
  }

  const fileName = photoUrl.slice(PHOTO_URL_PREFIX.length);

  if (!/^[a-f0-9-]+\.[a-z]{3}$/.test(fileName)) {
    return;
  }

  try {
    await unlink(join(UPLOAD_DIR, fileName));
  } catch {
    // Fichier déjà absent : rien à faire.
  }
}
