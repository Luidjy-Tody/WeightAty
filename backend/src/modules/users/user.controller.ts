import type { Request, Response } from 'express';
import type { TokenPayload } from '../../utils/jwt.js';
import { unauthorized, notFound, validationError } from '../../utils/http-error.js';
import { validatePhotoUpload, validateUpdateProfile } from '../../utils/validation.js';
import { saveProfilePhoto } from './photo.service.js';
import {
  anonymizeAccount,
  changePassword,
  clearUserPhoto,
  findUserById,
  getPreferences,
  getProfile,
  listReviews,
  setUserPhoto,
  updatePreferences,
  updateProfile,
} from './user.service.js';
import {
  validateChangePassword,
  validateDeleteAccount,
  validatePreferences,
} from '../../utils/validation.js';

/** Récupère le contenu du jeton (garanti par le middleware `authenticate`). */
function requireAuth(req: Request): TokenPayload {
  if (!req.auth) {
    throw unauthorized();
  }
  return req.auth;
}

/** GET /api/users/me — profil de l'utilisateur connecté. */
export async function getMe(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const profile = await getProfile(auth.sub);
  res.json(profile);
}

/** PUT /api/users/me — mise à jour du profil de l'utilisateur connecté. */
export async function updateMe(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const { data, errors } = validateUpdateProfile(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const profile = await updateProfile(auth.sub, data);
  res.json(profile);
}

/** GET /api/users/me/reviews — évaluations reçues par l'utilisateur connecté. */
export async function getMyReviews(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const limit = Math.min(Math.max(Number(req.query['limit']) || 20, 1), 50);
  const offset = Math.max(Number(req.query['offset']) || 0, 0);

  const page = await listReviews(auth.sub, limit, offset);
  res.json(page);
}

/** POST /api/users/me/photo — enregistre la photo de profil (base64). */
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const { data, errors } = validatePhotoUpload(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const photoUrl = await saveProfilePhoto(data.data, data.mimeType);
  const profile = await setUserPhoto(auth.sub, photoUrl);

  res.json(profile);
}

/** DELETE /api/users/me/photo — supprime la photo de profil. */
export async function deletePhoto(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const profile = await clearUserPhoto(auth.sub);

  res.json(profile);
}

/**
 * GET /api/users/:id/reviews — avis publics reçus par un utilisateur
 * (auteur affiché sous forme abrégée, aucune donnée sensible).
 */
export async function getUserReviews(req: Request, res: Response): Promise<void> {
  requireAuth(req);

  const userId = String(req.params['id']);
  const target = await findUserById(userId);

  if (!target) {
    throw notFound('Utilisateur introuvable.');
  }

  const limit = Math.min(Math.max(Number(req.query['limit']) || 20, 1), 50);
  const offset = Math.max(Number(req.query['offset']) || 0, 0);

  const page = await listReviews(userId, limit, offset);
  res.json(page);
}

/** GET /api/users/me/preferences — préférences du compte. */
export async function getPreferencesController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  res.json(await getPreferences(auth.sub));
}

/** PUT /api/users/me/preferences — mise à jour (partielle) des préférences. */
export async function updatePreferencesController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validatePreferences(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  res.json(await updatePreferences(auth.sub, data));
}

/** PUT /api/users/me/password — changement de mot de passe. */
export async function changePasswordController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateChangePassword(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  res.json(await changePassword(auth.sub, data));
}

/** DELETE /api/users/me — anonymise le compte (mot de passe exigé). */
export async function deleteAccountController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateDeleteAccount(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  await anonymizeAccount(auth.sub, data.password);
  res.status(204).send();
}
