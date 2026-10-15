import { randomUUID } from 'node:crypto';
import { pool } from '../../config/database.js';
import { conflict, notFound, validationError } from '../../utils/http-error.js';
import { signToken } from '../../utils/jwt.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  splitFullName,
  type ChangePasswordInput,
  type PreferencesInput,
  type RegisterInput,
  type UpdateProfileInput,
} from '../../utils/validation.js';
import { deleteProfilePhotoFile } from './photo.service.js';

/** Ligne brute de la table `users` (colonnes en snake_case). */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  role: string;
  is_verified: boolean;
  verified_at: Date | null;
  is_active: boolean;
  demo_role: string | null;
  language: string;
  notif_messages: boolean;
  notif_trajets: boolean;
  notif_paiements: boolean;
  privacy_full_name: boolean;
  privacy_show_photo: boolean;
  privacy_show_trips: boolean;
  tokens_valid_after: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** Utilisateur exposé par l'API (jamais d'empreinte de mot de passe). */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  role: string;
  isVerified: boolean;
  language: string;
  createdAt: string;
}

/** Statistiques agrégées affichées sur la page « Mon profil ». */
export interface ProfileStats {
  /** Nombre total de colis publiés par l'utilisateur (en tant qu'expéditeur). */
  envois: number;
  /** Nombre de trajets publiés (en tant que voyageur). */
  trajets: number;
  /** Nombre de colis encore en cours (en attente ou en transit). */
  colisEnCours: number;
  /** Nombre d'avis reçus. */
  avis: number;
  /** Note moyenne reçue (1 décimale). */
  noteMoyenne: number;
  /** Fiabilité en pourcentage (voir la formule ci-dessous). */
  fiabilite: number;
}

/** Avis reçu par l'utilisateur. */
export interface Review {
  id: string;
  note: number;
  commentaire: string | null;
  /** Puces enregistrées avec l'évaluation. */
  tags: string[];
  auteur: {
    /** Nom affiché de l'auteur, conforme à ses préférences de confidentialité. */
    displayName: string;
  };
  createdAt: string;
}

export interface Profile extends PublicUser {
  stats: ProfileStats;
  derniersAvis: Review[];
}

export interface ReviewPage {
  items: Review[];
  total: number;
  limit: number;
  offset: number;
}

/** Informations publiques d'un utilisateur (jamais d'e-mail, téléphone ni adresse). */
export interface PublicUserSummary {
  id: string;
  /** Nom affiché publiquement : nom complet ou « Prénom N. » selon les préférences. */
  displayName: string;
  photoUrl: string | null;
  isVerified: boolean;
  noteMoyenne: number;
  nombreAvis: number;
  /** Nombre de trajets publiés (0 si masqué par l'utilisateur). */
  nombreVoyages: number;
  /** `false` si l'utilisateur masque son nombre de voyages. */
  voyagesVisibles: boolean;
}

interface PublicUserSummaryRow {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  is_verified: boolean;
  privacy_full_name: boolean;
  privacy_show_photo: boolean;
  privacy_show_trips: boolean;
  note_moyenne: string;
  nombre_avis: string;
  nombre_voyages: string;
}

/** Nom abrégé public : « Jean Dupont » → « Jean D. ». */
export function abbreviateName(firstName: string, lastName: string): string {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return initial ? `${firstName} ${initial}.` : firstName;
}

/** Nom affiché d'un utilisateur selon sa préférence de confidentialité. */
export function publicDisplayName(row: {
  first_name: string;
  last_name: string;
  privacy_full_name: boolean;
}): string {
  if (row.privacy_full_name) {
    return `${row.first_name} ${row.last_name}`.trim();
  }
  return abbreviateName(row.first_name, row.last_name);
}

/**
 * Informations publiques d'un utilisateur : nom, photo, statut vérifié, note
 * moyenne, nombre d'avis et nombre de trajets publiés.
 * Les préférences de confidentialité sont appliquées ici : c'est le point
 * unique d'où proviennent les données publiques (trajets, colis, avis…).
 */
export async function getPublicUserSummary(userId: string): Promise<PublicUserSummary | null> {
  const result = await pool.query<PublicUserSummaryRow>(
    `SELECT u.id,
            u.first_name,
            u.last_name,
            u.photo_url,
            u.is_verified,
            u.privacy_full_name,
            u.privacy_show_photo,
            u.privacy_show_trips,
            coalesce(round(avg(e.note)::numeric, 1), 0) AS note_moyenne,
            (SELECT count(*) FROM evaluations e2 WHERE e2.cible_id = u.id) AS nombre_avis,
            (SELECT count(*) FROM trajets t
              WHERE t.voyageur_id = u.id AND t.statut <> 'brouillon') AS nombre_voyages
       FROM users u
       LEFT JOIN evaluations e ON e.cible_id = u.id
      WHERE u.id = $1
      GROUP BY u.id`,
    [userId]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    displayName: publicDisplayName(row),
    photoUrl: row.privacy_show_photo ? row.photo_url : null,
    isVerified: row.is_verified,
    noteMoyenne: Number(row.note_moyenne),
    nombreAvis: Number(row.nombre_avis),
    nombreVoyages: row.privacy_show_trips ? Number(row.nombre_voyages) : 0,
    voyagesVisibles: row.privacy_show_trips,
  };
}

/** Solde du portefeuille d'un utilisateur. */
export async function getWallet(userId: string): Promise<{ balance: number; currency: string }> {
  const result = await pool.query<{ wallet_balance: string; wallet_currency: string }>(
    'SELECT wallet_balance, wallet_currency FROM users WHERE id = $1',
    [userId]
  );

  const row = result.rows[0];

  return {
    balance: row ? Number(row.wallet_balance) : 0,
    currency: row?.wallet_currency ?? 'MUR',
  };
}

const USER_COLUMNS =
  'id, email, password_hash, first_name, last_name, phone, address, photo_url, role, is_verified, verified_at, ' +
  'is_active, demo_role, language, notif_messages, notif_trajets, notif_paiements, privacy_full_name, ' +
  'privacy_show_photo, privacy_show_trips, tokens_valid_after, created_at, updated_at';

/** Convertit une ligne de base en utilisateur public. */
export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    address: row.address,
    photoUrl: row.photo_url,
    role: row.role,
    isVerified: row.is_verified,
    language: row.language,
    createdAt: row.created_at.toISOString(),
  };
}

/** Recherche un utilisateur par son identifiant. */
export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

/** Recherche un utilisateur par son adresse e-mail (insensible à la casse). */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = lower($1)`,
    [email]
  );
  return result.rows[0] ?? null;
}

/** Recherche l'utilisateur de démonstration associé à un rôle (compte actif). */
export async function findActiveUserByDemoRole(role: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE demo_role = $1 AND is_active = true LIMIT 1`,
    [role]
  );
  return result.rows[0] ?? null;
}

/** Liste les rôles de démonstration effectivement disponibles en base. */
export async function listAvailableDemoRoles(): Promise<string[]> {
  const result = await pool.query<{ demo_role: string }>(
    'SELECT demo_role FROM users WHERE demo_role IS NOT NULL AND is_active = true'
  );
  return result.rows.map((row) => row.demo_role);
}

/** Crée un utilisateur et renvoie sa ligne complète. */
export async function createUser(
  input: Omit<RegisterInput, 'password'> & { passwordHash: string }
): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USER_COLUMNS}`,
    [input.email, input.passwordHash, input.firstName, input.lastName, input.phone]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("La création de l'utilisateur a échoué.");
  }
  return row;
}

interface StatsRow {
  envois: string;
  trajets: string;
  colis_en_cours: string;
  avis: string;
  note_moyenne: string;
  transactions_ok: string;
  transactions_ko: string;
}

/**
 * Calcule les statistiques de l'utilisateur.
 *
 * Formule de fiabilité : part des transactions terminées sans litige ni
 * annulation, soit `terminées_sans_litige / (terminées_sans_litige + annulées_ou_litigeuses) * 100`.
 * Les transactions encore en cours ne sont pas prises en compte. Par défaut,
 * un utilisateur sans transaction terminée ni annulée a une fiabilité de 100 %.
 */
export async function getStats(userId: string): Promise<ProfileStats> {
  const result = await pool.query<StatsRow>(
    `SELECT
       (SELECT count(*) FROM colis c WHERE c.expediteur_id = $1) AS envois,
       (SELECT count(*) FROM trajets t WHERE t.voyageur_id = $1) AS trajets,
       (SELECT count(*) FROM colis c
          WHERE c.expediteur_id = $1 AND c.statut IN ('en_attente', 'en_transit')) AS colis_en_cours,
       (SELECT count(*) FROM evaluations e WHERE e.cible_id = $1) AS avis,
       (SELECT coalesce(round(avg(e.note)::numeric, 1), 0)
          FROM evaluations e WHERE e.cible_id = $1) AS note_moyenne,
       (SELECT count(*) FROM demandes d
          WHERE (d.expediteur_id = $1 OR d.voyageur_id = $1)
            AND d.statut = 'terminee' AND d.litige = false) AS transactions_ok,
       (SELECT count(*) FROM demandes d
          WHERE (d.expediteur_id = $1 OR d.voyageur_id = $1)
            AND (d.statut = 'annulee' OR d.litige = true)) AS transactions_ko`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Le calcul des statistiques a échoué.');
  }

  const ok = Number(row.transactions_ok);
  const ko = Number(row.transactions_ko);
  const total = ok + ko;

  return {
    envois: Number(row.envois),
    trajets: Number(row.trajets),
    colisEnCours: Number(row.colis_en_cours),
    avis: Number(row.avis),
    noteMoyenne: Number(row.note_moyenne),
    fiabilite: total === 0 ? 100 : Math.round((ok / total) * 100),
  };
}

interface ReviewRow {
  id: string;
  note: number;
  commentaire: string | null;
  tags: string[] | null;
  auteur_first_name: string;
  auteur_last_name: string;
  auteur_full_name: boolean;
  created_at: Date;
}

const REVIEW_SELECT = `
  SELECT e.id,
         e.note,
         e.commentaire,
         e.tags,
         e.created_at,
         a.first_name AS auteur_first_name,
         a.last_name  AS auteur_last_name,
         a.privacy_full_name AS auteur_full_name
    FROM evaluations e
    JOIN users a ON a.id = e.auteur_id
   WHERE e.cible_id = $1
   ORDER BY e.created_at DESC`;

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    note: row.note,
    commentaire: row.commentaire,
    tags: row.tags ?? [],
    auteur: {
      displayName: publicDisplayName({
        first_name: row.auteur_first_name,
        last_name: row.auteur_last_name,
        privacy_full_name: row.auteur_full_name,
      }),
    },
    createdAt: row.created_at.toISOString(),
  };
}

/** Renvoie les évaluations reçues par l'utilisateur (les plus récentes d'abord). */
export async function listReviews(userId: string, limit: number, offset: number): Promise<ReviewPage> {
  const [reviews, count] = await Promise.all([
    pool.query<ReviewRow>(`${REVIEW_SELECT} LIMIT $2 OFFSET $3`, [userId, limit, offset]),
    pool.query<{ total: string }>('SELECT count(*) AS total FROM evaluations WHERE cible_id = $1', [
      userId,
    ]),
  ]);

  return {
    items: reviews.rows.map(toReview),
    total: Number(count.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

/** Renvoie le profil complet : identité, statistiques et dernières évaluations. */
export async function getProfile(userId: string): Promise<Profile> {
  const [user, stats, reviews] = await Promise.all([
    findUserById(userId),
    getStats(userId),
    listReviews(userId, 2, 0),
  ]);

  if (!user) {
    throw notFound('Utilisateur introuvable.');
  }

  return { ...toPublicUser(user), stats, derniersAvis: reviews.items };
}

/**
 * Met à jour les informations personnelles de l'utilisateur connecté.
 *
 * Le nom complet est séparé en prénom / nom (`splitFullName`). Le statut
 * « vérifié » n'est pas réinitialisé : aucune procédure de vérification
 * n'existe encore dans le projet (point à valider).
 */
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  const existing = await findUserByEmail(input.email);

  if (existing && existing.id !== userId) {
    throw conflict('Cette adresse e-mail est déjà utilisée par un autre compte.', {
      email: 'Cette adresse e-mail est déjà utilisée.',
    });
  }

  const { firstName, lastName } = splitFullName(input.fullName);

  const result = await pool.query<UserRow>(
    `UPDATE users
        SET first_name = $2,
            last_name  = $3,
            email      = $4,
            phone      = $5,
            address    = $6
      WHERE id = $1
      RETURNING ${USER_COLUMNS}`,
    [userId, firstName, lastName, input.email, input.phone, input.address]
  );

  if (result.rowCount === 0) {
    throw notFound('Utilisateur introuvable.');
  }

  return getProfile(userId);
}

/** Enregistre la nouvelle photo de profil et supprime l'ancienne (au mieux). */
export async function setUserPhoto(userId: string, photoUrl: string): Promise<Profile> {
  const current = await findUserById(userId);

  if (!current) {
    throw notFound('Utilisateur introuvable.');
  }

  await pool.query('UPDATE users SET photo_url = $2 WHERE id = $1', [userId, photoUrl]);
  await deleteProfilePhotoFile(current.photo_url);

  return getProfile(userId);
}

/** Supprime la photo de profil (l'avatar repasse aux initiales). */
export async function clearUserPhoto(userId: string): Promise<Profile> {
  const current = await findUserById(userId);

  if (!current) {
    throw notFound('Utilisateur introuvable.');
  }

  await pool.query('UPDATE users SET photo_url = NULL WHERE id = $1', [userId]);
  await deleteProfilePhotoFile(current.photo_url);

  return getProfile(userId);
}

// -----------------------------------------------------------------------------
// Paramètres du compte (notifications, confidentialité, langue, sécurité)
// -----------------------------------------------------------------------------

export interface UserPreferences {
  notifications: { messages: boolean; trajets: boolean; paiements: boolean };
  privacy: { fullName: boolean; photo: boolean; trips: boolean };
  language: string;
}

function toPreferences(row: UserRow): UserPreferences {
  return {
    notifications: {
      messages: row.notif_messages,
      trajets: row.notif_trajets,
      paiements: row.notif_paiements,
    },
    privacy: {
      fullName: row.privacy_full_name,
      photo: row.privacy_show_photo,
      trips: row.privacy_show_trips,
    },
    language: row.language,
  };
}

/** Préférences de l'utilisateur connecté. */
export async function getPreferences(userId: string): Promise<UserPreferences> {
  const row = await findUserById(userId);

  if (!row) {
    throw notFound('Utilisateur introuvable.');
  }

  return toPreferences(row);
}

/** Met à jour (partiellement) les préférences de l'utilisateur connecté. */
export async function updatePreferences(
  userId: string,
  input: PreferencesInput
): Promise<UserPreferences> {
  const result = await pool.query<UserRow>(
    `UPDATE users
        SET notif_messages     = coalesce($2, notif_messages),
            notif_trajets      = coalesce($3, notif_trajets),
            notif_paiements    = coalesce($4, notif_paiements),
            privacy_full_name  = coalesce($5, privacy_full_name),
            privacy_show_photo = coalesce($6, privacy_show_photo),
            privacy_show_trips = coalesce($7, privacy_show_trips),
            language           = coalesce($8, language)
      WHERE id = $1
      RETURNING ${USER_COLUMNS}`,
    [
      userId,
      input.notifications?.messages ?? null,
      input.notifications?.trajets ?? null,
      input.notifications?.paiements ?? null,
      input.privacy?.fullName ?? null,
      input.privacy?.photo ?? null,
      input.privacy?.trips ?? null,
      input.language ?? null,
    ]
  );

  const row = result.rows[0];

  if (!row) {
    throw notFound('Utilisateur introuvable.');
  }

  return toPreferences(row);
}

/**
 * Change le mot de passe de l'utilisateur connecté.
 *
 * Vérifie le mot de passe actuel, refuse un mot de passe identique, hache avec
 * l'algorithme existant (scrypt) puis **invalide les autres sessions** en
 * refusant les jetons émis avant l'opération. Un nouveau jeton est renvoyé pour
 * prolonger la session courante.
 */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<{ token: string }> {
  const row = await findUserById(userId);

  if (!row) {
    throw notFound('Utilisateur introuvable.');
  }

  const currentMatches = await verifyPassword(input.currentPassword, row.password_hash);

  if (!currentMatches) {
    throw validationError({ currentPassword: 'Le mot de passe actuel est incorrect.' });
  }

  const sameAsCurrent = await verifyPassword(input.newPassword, row.password_hash);

  if (sameAsCurrent) {
    throw validationError({
      newPassword: "Le nouveau mot de passe doit être différent de l'actuel.",
    });
  }

  const passwordHash = await hashPassword(input.newPassword);

  await pool.query(
    'UPDATE users SET password_hash = $2, tokens_valid_after = now() WHERE id = $1',
    [userId, passwordHash]
  );

  return { token: signToken({ sub: row.id, email: row.email, role: row.role }) };
}

/** Colis et trajets en cours empêchant la suppression du compte. */
export async function countOngoingActivity(
  userId: string
): Promise<{ colis: number; trajets: number }> {
  const result = await pool.query<{ colis: string; trajets: string }>(
    `SELECT
       (SELECT count(*) FROM colis c
         WHERE c.expediteur_id = $1 AND c.statut IN ('en_attente', 'en_transit')) AS colis,
       (SELECT count(*) FROM trajets t
         WHERE t.voyageur_id = $1 AND t.statut IN ('publie', 'complet')) AS trajets`,
    [userId]
  );

  const row = result.rows[0];

  return { colis: Number(row?.colis ?? 0), trajets: Number(row?.trajets ?? 0) };
}

/**
 * Anonymise le compte de l'utilisateur connecté après vérification du mot de
 * passe.
 *
 * Refusé tant qu'un colis ou un trajet est en cours. Les données nécessaires
 * aux transactions et aux avis (paiements, évaluations) sont conservées, seule
 * l'identité est effacée ; le compte est désactivé et toutes les sessions sont
 * invalidées.
 */
export async function anonymizeAccount(userId: string, password: string): Promise<void> {
  const row = await findUserById(userId);

  if (!row) {
    throw notFound('Utilisateur introuvable.');
  }

  const passwordMatches = await verifyPassword(password, row.password_hash);

  if (!passwordMatches) {
    throw validationError({ password: 'Mot de passe incorrect.' });
  }

  const ongoing = await countOngoingActivity(userId);

  if (ongoing.colis > 0 || ongoing.trajets > 0) {
    throw conflict(
      'Suppression impossible : vous avez des colis ou des trajets en cours. Terminez-les ou annulez-les avant de supprimer votre compte.'
    );
  }

  const anonymousHash = await hashPassword(randomUUID());

  await pool.query(
    `UPDATE users
        SET email              = $2,
            password_hash      = $3,
            first_name         = 'Utilisateur',
            last_name          = 'supprimé',
            phone              = NULL,
            address            = NULL,
            photo_url          = NULL,
            is_verified        = false,
            is_active          = false,
            tokens_valid_after = now()
      WHERE id = $1`,
    [userId, `compte-supprime-${randomUUID()}@weightaty.invalid`, anonymousHash]
  );

  await deleteProfilePhotoFile(row.photo_url);
}
