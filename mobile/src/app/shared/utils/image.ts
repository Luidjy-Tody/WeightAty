/**
 * Traitement côté client de la photo de profil : lecture du fichier choisi,
 * redimensionnement et compression avant envoi à l'API.
 */

/** Taille maximale du fichier source accepté (2 Mo). */
export const MAX_PHOTO_FILE_BYTES = 2 * 1024 * 1024;

/** Dimension maximale (largeur ou hauteur) de la photo redimensionnée. */
const MAX_PHOTO_DIMENSION = 512;

/** Qualité JPEG appliquée à la compression. */
const JPEG_QUALITY = 0.85;

/** Types d'image acceptés. */
const SUPPORTED_TYPES = ['image/jpeg', 'image/png'];

/** Photo prête à être envoyée à l'API. */
export interface ProcessedPhoto {
  /** Contenu base64 (sans préfixe `data:`). */
  data: string;
  mimeType: string;
}

/** Indique si le fichier choisi est un JPG ou un PNG. */
export function isSupportedPhoto(file: File): boolean {
  return SUPPORTED_TYPES.includes(file.type);
}

/** Lit un fichier en « data URL ». */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
}

/** Charge une image depuis une « data URL ». */
function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image illisible.'));
    image.src = source;
  });
}

/**
 * Redimensionne et compresse la photo choisie (sortie JPEG) afin de limiter
 * la taille envoyée à l'API.
 */
export async function processProfilePhoto(file: File): Promise<ProcessedPhoto> {
  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error("Le traitement de l'image n'est pas disponible.");
  }

  context.drawImage(image, 0, 0, width, height);

  const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  return { data: compressed.split(',')[1] ?? '', mimeType: 'image/jpeg' };
}
