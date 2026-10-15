import { pool } from '../../config/database.js';
import { conflict, forbidden, notFound, unauthorized } from '../../utils/http-error.js';
import { signToken } from '../../utils/jwt.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import type { LoginInput, RegisterInput } from '../../utils/validation.js';
import {
  createUser,
  findActiveUserByDemoRole,
  findUserByEmail,
  findUserById,
  listAvailableDemoRoles,
  toPublicUser,
  type PublicUser,
  type UserRow,
} from '../users/user.service.js';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** Rôles proposés par l'accès démo (voir `GET /api/auth/demo-accounts`). */
export const DEMO_ROLES = ['expediteur', 'voyageur', 'admin'] as const;

export type DemoRole = (typeof DEMO_ROLES)[number];

/** Libellés affichés pour les puces de l'accès démo. */
const DEMO_LABELS: Record<DemoRole, string> = {
  expediteur: 'Expéditeur',
  voyageur: 'Voyageur',
  admin: 'Admin',
};

export interface DemoAccount {
  role: DemoRole;
  label: string;
}

/**
 * L'accès démo n'est autorisé que si la configuration l'explicite.
 * `DEMO_MODE` a la priorité ; à défaut, il est activé hors production
 * et désactivé en production.
 */
function isDemoModeEnabled(): boolean {
  const flag = process.env.DEMO_MODE?.trim().toLowerCase();

  if (flag === 'true') {
    return true;
  }
  if (flag === 'false') {
    return false;
  }

  return process.env.NODE_ENV !== 'production';
}

/** Indique si une valeur correspond à un rôle de démonstration connu. */
export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === 'string' && (DEMO_ROLES as readonly string[]).includes(value);
}

/** Construit la réponse de connexion (jeton + utilisateur public). */
function buildAuthResult(row: UserRow): AuthResult {
  const user = toPublicUser(row);
  return { token: signToken({ sub: user.id, email: user.email, role: user.role }), user };
}

/** Détecte une violation de contrainte d'unicité PostgreSQL. */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

/** Inscription : crée le compte puis renvoie un jeton de session. */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);

  if (existing) {
    throw conflict('Un compte existe déjà avec cette adresse e-mail.', {
      email: 'Un compte existe déjà avec cette adresse e-mail.',
    });
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const row = await createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });

    const user = toPublicUser(row);
    return { token: signToken({ sub: user.id, email: user.email, role: user.role }), user };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict('Un compte existe déjà avec cette adresse e-mail.', {
        email: 'Un compte existe déjà avec cette adresse e-mail.',
      });
    }
    throw error;
  }
}

/** Connexion : vérifie les identifiants puis renvoie un jeton de session. */
export async function login(input: LoginInput): Promise<AuthResult> {
  const row = await findUserByEmail(input.email);
  const invalid = unauthorized('E-mail ou mot de passe incorrect.');

  if (!row) {
    throw invalid;
  }

  const passwordMatches = await verifyPassword(input.password, row.password_hash);

  if (!passwordMatches) {
    throw invalid;
  }

  // Le compte désactivé n'est signalé qu'après vérification du mot de passe,
  // afin de ne jamais révéler l'existence d'un compte à un tiers.
  if (!row.is_active) {
    throw forbidden('Ce compte a été désactivé. Veuillez contacter le support.');
  }

  return buildAuthResult(row);
}

/** Renvoie l'utilisateur de la session courante (restauration au démarrage). */
export async function getSessionUser(userId: string): Promise<PublicUser> {
  const row = await findUserById(userId);

  if (!row) {
    throw unauthorized('Session invalide, veuillez vous reconnecter.');
  }

  if (!row.is_active) {
    throw forbidden('Ce compte a été désactivé. Veuillez contacter le support.');
  }

  return toPublicUser(row);
}

/** Liste les comptes de démonstration disponibles (vide si l'accès est désactivé). */
export async function listDemoAccounts(): Promise<DemoAccount[]> {
  if (!isDemoModeEnabled()) {
    return [];
  }

  const available = new Set(await listAvailableDemoRoles());

  return DEMO_ROLES.filter((role) => available.has(role)).map((role) => ({
    role,
    label: DEMO_LABELS[role],
  }));
}

/**
 * Connexion avec un compte de démonstration.
 * Les identifiants ne quittent jamais le serveur : le client envoie seulement
 * le rôle souhaité et reçoit un jeton.
 */
export async function demoLogin(role: DemoRole): Promise<AuthResult> {
  if (!isDemoModeEnabled()) {
    throw notFound("L'accès démo est désactivé.");
  }

  const row = await findActiveUserByDemoRole(role);

  if (!row) {
    throw notFound('Aucun compte de démonstration disponible pour ce rôle.');
  }

  return buildAuthResult(row);
}

/**
 * Révoque un jeton de session (déconnexion).
 * Les jetons expirés sont supprimés au passage pour limiter la croissance de la table.
 */
export async function revokeToken(jti: string, expiresAt: number): Promise<void> {
  await Promise.all([
    pool.query(
      `INSERT INTO revoked_tokens (jti, expires_at)
       VALUES ($1, to_timestamp($2))
       ON CONFLICT (jti) DO NOTHING`,
      [jti, expiresAt]
    ),
    pool.query('DELETE FROM revoked_tokens WHERE expires_at < now()'),
  ]);
}

/**
 * Indique si un jeton doit être refusé : jeton révoqué (déconnexion), compte
 * désactivé, ou jeton émis avant l'invalidation globale de la session
 * (changement de mot de passe, suppression de compte).
 */
export async function isSessionRejected(
  jti: string,
  userId: string,
  issuedAt: number
): Promise<boolean> {
  const result = await pool.query<{
    revoked: boolean;
    valid_after: Date | null;
    is_active: boolean | null;
  }>(
    `SELECT
       EXISTS (SELECT 1 FROM revoked_tokens WHERE jti = $1) AS revoked,
       (SELECT tokens_valid_after FROM users WHERE id = $2) AS valid_after,
       (SELECT is_active FROM users WHERE id = $2) AS is_active`,
    [jti, userId]
  );

  const row = result.rows[0];

  if (!row) {
    return true;
  }

  if (row.revoked || row.is_active === false) {
    return true;
  }

  // Tolérance d'une seconde : le jeton est daté en secondes.
  return row.valid_after !== null && issuedAt * 1000 < row.valid_after.getTime() - 1000;
}
