import type { Request, Response } from 'express';
import { unauthorized, validationError } from '../../utils/http-error.js';
import { validateDemoLogin, validateLogin, validateRegister } from '../../utils/validation.js';
import {
  demoLogin,
  getSessionUser,
  isDemoRole,
  listDemoAccounts,
  login,
  register,
  revokeToken,
} from './auth.service.js';

/** Vérifie que le corps de requête ne contient pas d'erreur de validation. */
function assertValid(errors: Record<string, string>): void {
  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }
}

/** POST /api/auth/register — inscription. */
export async function registerController(req: Request, res: Response): Promise<void> {
  const { data, errors } = validateRegister(req.body);
  assertValid(errors);

  const result = await register(data);
  res.status(201).json(result);
}

/** POST /api/auth/login — connexion. */
export async function loginController(req: Request, res: Response): Promise<void> {
  const { data, errors } = validateLogin(req.body);
  assertValid(errors);

  const result = await login(data);
  res.json(result);
}

/** POST /api/auth/logout — déconnexion (révocation du jeton courant). */
export async function logoutController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw unauthorized();
  }

  await revokeToken(req.auth.jti, req.auth.exp);
  res.status(204).send();
}

/** GET /api/auth/me — utilisateur de la session courante (restauration au démarrage). */
export async function meController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw unauthorized();
  }

  const user = await getSessionUser(req.auth.sub);
  res.json({ user });
}

/**
 * GET /api/auth/demo-accounts — rôles de démonstration disponibles.
 * Renvoie `{ enabled: false, accounts: [] }` si l'accès démo est désactivé.
 */
export async function demoAccountsController(_req: Request, res: Response): Promise<void> {
  const accounts = await listDemoAccounts();
  res.json({ enabled: accounts.length > 0, accounts });
}

/** POST /api/auth/demo-login — connexion immédiate avec un compte de démonstration. */
export async function demoLoginController(req: Request, res: Response): Promise<void> {
  const { data, errors } = validateDemoLogin(req.body);
  assertValid(errors);

  if (!isDemoRole(data.role)) {
    throw validationError({ role: 'Rôle de démonstration inconnu.' });
  }

  const result = await demoLogin(data.role);
  res.json(result);
}
