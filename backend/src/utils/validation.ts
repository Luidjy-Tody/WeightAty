/**
 * Validation des données entrantes, sans dépendance externe.
 * Tous les messages d'erreur sont rédigés en français et destinés à être
 * affichés sous le champ correspondant côté mobile.
 */

export type FieldErrors = Record<string, string>;

/** Longueurs maximales alignées sur le schéma PostgreSQL. */
export const LIMITS = {
  name: 100,
  email: 255,
  phone: 30,
  passwordMin: 8,
  passwordMax: 128,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Numéro international normalisé : « + » optionnel puis 6 à 15 chiffres. */
const PHONE_REGEX = /^\+?[0-9]{6,15}$/;

/** Limites des informations personnelles. */
export const PROFILE_LIMITS = {
  fullNameMin: 2,
  fullNameMax: 100,
  emailMax: 255,
  phoneMax: 30,
  addressMax: 200,
} as const;

/**
 * Normalise un numéro de téléphone : supprime espaces, points, tirets et
 * parenthèses, conserve un « + » initial (ex. « +230 5 123 4567 » →
 * « +23051234567 »).
 */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

/**
 * Sépare un nom complet en prénom + nom de famille : le premier mot devient le
 * prénom, le reste le nom (ex. « Jean Dupont » → « Jean » / « Dupont »).
 * Règle unique appliquée côté serveur lors de l'enregistrement.
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? '';
  return { firstName, lastName: parts.join(' ') };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  password: string;
}

export interface UpdateProfileInput {
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
}

export interface PhotoUploadInput {
  data: string;
  mimeType: string;
}

export interface DemoLoginInput {
  role: string;
}

/** Limites métier des trajets (partagées avec le client). */
export const TRAJET_LIMITS = {
  /** Poids maximal proposé par trajet, en kg. */
  maxWeightKg: 50,
  /** Prix maximal par kg (devise de l'application). */
  maxPricePerKg: 50000,
  /** Longueur maximale de la compagnie aérienne. */
  airlineMaxLength: 120,
  /** Longueur maximale du numéro de vol. */
  flightNumberMaxLength: 20,
  /** Longueur maximale des informations supplémentaires. */
  notesMaxLength: 500,
} as const;

/** Devise de l'application (roupie mauricienne, symbole « Rs »). */
export const APP_CURRENCY = 'MUR';

export interface CreateTrajetInput {
  departIata: string;
  arriveeIata: string;
  dateDepart: string;
  dateArrivee: string;
  poidsDisponibleKg: number;
  prixParKg: number;
  compagnieAerienne: string;
  numeroVol: string;
  informationsSupplementaires: string | null;
}

function asRecord(body: unknown): Record<string, unknown> {
  return body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

/** Convertit une valeur en chaîne nettoyée, ou null si absente. */
function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateName(value: string | null, field: string, errors: FieldErrors, label: string): string {
  if (!value) {
    errors[field] = `${label} est obligatoire.`;
    return '';
  }
  if (value.length > LIMITS.name) {
    errors[field] = `${label} ne doit pas dépasser ${LIMITS.name} caractères.`;
  }
  return value;
}

function validateEmail(value: string | null, errors: FieldErrors): string {
  if (!value) {
    errors['email'] = "L'adresse e-mail est obligatoire.";
    return '';
  }
  if (value.length > LIMITS.email) {
    errors['email'] = `L'adresse e-mail ne doit pas dépasser ${LIMITS.email} caractères.`;
  } else if (!EMAIL_REGEX.test(value)) {
    errors['email'] = "Le format de l'adresse e-mail est invalide.";
  }
  return value;
}

function validatePhone(value: string | null, errors: FieldErrors): string | null {
  if (value === null) {
    return null;
  }

  const normalized = normalizePhone(value);

  if (normalized.length > LIMITS.phone) {
    errors['phone'] = `Le numéro de téléphone ne doit pas dépasser ${LIMITS.phone} caractères.`;
  } else if (!PHONE_REGEX.test(normalized)) {
    errors['phone'] = 'Le format du numéro de téléphone est invalide.';
  }

  return normalized;
}

function validatePassword(value: string | null, errors: FieldErrors): string {
  if (!value) {
    errors['password'] = 'Le mot de passe est obligatoire.';
    return '';
  }
  if (value.length < LIMITS.passwordMin) {
    errors['password'] = `Le mot de passe doit contenir au moins ${LIMITS.passwordMin} caractères.`;
  } else if (value.length > LIMITS.passwordMax) {
    errors['password'] = `Le mot de passe ne doit pas dépasser ${LIMITS.passwordMax} caractères.`;
  }
  return value;
}

/** Valide les données de connexion. */
export function validateLogin(body: unknown): { data: LoginInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  const email = validateEmail(toStringOrNull(source['email']), errors);
  const password = toStringOrNull(source['password']);

  if (!password) {
    errors['password'] = 'Le mot de passe est obligatoire.';
  }

  return { data: { email, password: password ?? '' }, errors };
}

/** Valide les données d'inscription. */
export function validateRegister(body: unknown): { data: RegisterInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  const firstName = validateName(toStringOrNull(source['firstName']), 'firstName', errors, 'Le prénom');
  const lastName = validateName(toStringOrNull(source['lastName']), 'lastName', errors, 'Le nom');
  const email = validateEmail(toStringOrNull(source['email']), errors);
  const phone = validatePhone(toStringOrNull(source['phone']), errors);
  const password = validatePassword(toStringOrNull(source['password']), errors);

  return { data: { firstName, lastName, email, phone, password }, errors };
}

/**
 * Valide les informations personnelles : nom complet, e-mail, téléphone, adresse.
 * Le nom complet est séparé en prénom / nom lors de l'enregistrement
 * (voir `splitFullName`).
 */
export function validateUpdateProfile(body: unknown): { data: UpdateProfileInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  const fullName = toStringOrNull(source['fullName']) ?? '';

  if (!fullName) {
    errors['fullName'] = 'Le nom complet est obligatoire.';
  } else if (fullName.length < PROFILE_LIMITS.fullNameMin) {
    errors['fullName'] = `Le nom complet doit contenir au moins ${PROFILE_LIMITS.fullNameMin} caractères.`;
  } else if (fullName.length > PROFILE_LIMITS.fullNameMax) {
    errors['fullName'] = `Le nom complet ne doit pas dépasser ${PROFILE_LIMITS.fullNameMax} caractères.`;
  }

  const email = validateEmail(toStringOrNull(source['email']), errors);
  const phone = validatePhone(toStringOrNull(source['phone']), errors);

  const address = toStringOrNull(source['address']);

  if (address && address.length > PROFILE_LIMITS.addressMax) {
    errors['address'] = `L'adresse ne doit pas dépasser ${PROFILE_LIMITS.addressMax} caractères.`;
  }

  return { data: { fullName, email, phone, address }, errors };
}

/** Types MIME acceptés pour une photo de profil. */
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png'];/**
 * Valide l'envoi d'une photo de profil.
 * Accepte un contenu base64 brut ou une « data URL » complète
 * (`data:image/png;base64,…`).
 */
export function validatePhotoUpload(body: unknown): { data: PhotoUploadInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  let data = toStringOrNull(source['data']) ?? '';
  let mimeType = toStringOrNull(source['mimeType']) ?? '';

  const dataUrlMatch = /^data:([^;]+);base64,(.*)$/s.exec(data);

  if (dataUrlMatch) {
    mimeType = mimeType || (dataUrlMatch[1] ?? '');
    data = dataUrlMatch[2] ?? '';
  }

  if (!data) {
    errors['photo'] = "L'image est obligatoire.";
  } else if (!ALLOWED_PHOTO_TYPES.includes(mimeType)) {
    errors['photo'] = "Format d'image non pris en charge (JPG ou PNG attendu).";
  }

  return { data: { data, mimeType }, errors };
}

// -----------------------------------------------------------------------------
// Suivi des colis, évaluations, signalements, messagerie
// -----------------------------------------------------------------------------

/** Limites des évaluations. */
export const EVALUATION_LIMITS = {
  commentMax: 500,
  tagsMax: 5,
  tagMaxLength: 40,
} as const;

/** Motifs de signalement acceptés. */
export const SIGNALEMENT_MOTIFS = [
  'retard',
  'comportement',
  'colis_endommage',
  'non_conforme',
  'autre',
] as const;

/** Limites des signalements et des messages. */
export const SIGNALEMENT_LIMITS = { motifMax: 60, messageMax: 1000 } as const;
export const MESSAGE_LIMITS = { contenuMax: 1000 } as const;

/** Étapes qu'un voyageur peut enregistrer depuis l'application. */
export const COLIS_ETAPES_VOYAGEUR = [
  'remis_voyageur',
  'en_transit',
  'arrive_destination',
] as const;

export interface AdvanceEtapeInput {
  etape: string;
}

/** Valide l'étape transmise lors de l'avancement du suivi. */
export function validateAdvanceEtape(body: unknown): { data: AdvanceEtapeInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};
  const etape = toStringOrNull(source['etape']) ?? '';

  if (!etape) {
    errors['etape'] = "L'étape est obligatoire.";
  } else if (!(COLIS_ETAPES_VOYAGEUR as readonly string[]).includes(etape)) {
    errors['etape'] = "Cette étape ne peut pas être enregistrée manuellement.";
  }

  return { data: { etape }, errors };
}

export interface CreateEvaluationInput {
  note: number;
  commentaire: string | null;
  tags: string[];
}

/** Valide une évaluation de voyageur. */
export function validateCreateEvaluation(body: unknown): {
  data: CreateEvaluationInput;
  errors: FieldErrors;
} {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  const note = parseNumber(source['note']);

  if (note === null) {
    errors['note'] = 'La note est obligatoire.';
  } else if (!Number.isInteger(note) || note < 1 || note > 5) {
    errors['note'] = 'La note doit être comprise entre 1 et 5.';
  }

  const commentaire = toStringOrNull(source['commentaire']);

  if (commentaire && commentaire.length > EVALUATION_LIMITS.commentMax) {
    errors['commentaire'] =
      `Le commentaire ne doit pas dépasser ${EVALUATION_LIMITS.commentMax} caractères.`;
  }

  const rawTags = source['tags'];
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
        .map((tag) => String(tag).trim())
        .filter((tag) => tag.length > 0 && tag.length <= EVALUATION_LIMITS.tagMaxLength)
        .slice(0, EVALUATION_LIMITS.tagsMax)
    : [];

  return { data: { note: note ?? 0, commentaire, tags }, errors };
}

export interface CreateSignalementInput {
  cibleType: string;
  cibleId: string;
  motif: string;
  message: string | null;
}

/** Valide un signalement. */
export function validateCreateSignalement(body: unknown): {
  data: CreateSignalementInput;
  errors: FieldErrors;
} {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  const cibleType = toStringOrNull(source['cibleType']) ?? '';
  if (cibleType !== 'trajet' && cibleType !== 'colis') {
    errors['cibleType'] = 'Le type de signalement est invalide.';
  }

  const cibleId = toStringOrNull(source['cibleId']) ?? '';
  if (!cibleId) {
    errors['cibleId'] = 'La ressource à signaler est obligatoire.';
  }

  const motif = toStringOrNull(source['motif']) ?? '';
  if (!motif) {
    errors['motif'] = 'Le motif est obligatoire.';
  } else if (!(SIGNALEMENT_MOTIFS as readonly string[]).includes(motif)) {
    errors['motif'] = 'Le motif est invalide.';
  }

  const message = toStringOrNull(source['message']);

  if (message && message.length > SIGNALEMENT_LIMITS.messageMax) {
    errors['message'] =
      `Le message ne doit pas dépasser ${SIGNALEMENT_LIMITS.messageMax} caractères.`;
  }

  return { data: { cibleType, cibleId, motif, message }, errors };
}

export interface SendMessageInput {
  contenu: string;
}

/** Valide l'envoi d'un message. */
export function validateSendMessage(body: unknown): { data: SendMessageInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};
  const contenu = toStringOrNull(source['contenu']) ?? '';

  if (!contenu) {
    errors['contenu'] = 'Le message est obligatoire.';
  } else if (contenu.length > MESSAGE_LIMITS.contenuMax) {
    errors['contenu'] = `Le message ne doit pas dépasser ${MESSAGE_LIMITS.contenuMax} caractères.`;
  }

  return { data: { contenu }, errors };
}

export interface CreateConversationInput {
  userId: string;
}

// -----------------------------------------------------------------------------
// Paramètres du compte
// -----------------------------------------------------------------------------

/**
 * Langues proposées par l'application.
 * Seul le français est disponible : les traductions n'existent pas encore.
 * Ajouter une entrée ici (et les traductions) suffira à exposer la langue.
 */
export const SUPPORTED_LANGUAGES = ['fr'] as const;

export interface PreferencesInput {
  notifications?: { messages: boolean; trajets: boolean; paiements: boolean };
  privacy?: { fullName: boolean; photo: boolean; trips: boolean };
  language?: string;
}

function readBoolean(source: Record<string, unknown>, key: string): boolean | null {
  const value = source[key];
  return typeof value === 'boolean' ? value : null;
}

function readGroup(
  value: unknown,
  keys: string[],
  errors: FieldErrors,
  field: string
): Record<string, boolean> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'object') {
    errors[field] = 'Les préférences sont invalides.';
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const group: Record<string, boolean> = {};

  for (const key of keys) {
    const parsed = readBoolean(source, key);

    if (parsed === null) {
      errors[field] = 'Les préférences sont invalides.';
      return undefined;
    }

    group[key] = parsed;
  }

  return group;
}

/** Valide une mise à jour (partielle) des préférences du compte. */
export function validatePreferences(body: unknown): { data: PreferencesInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  const notifications = readGroup(
    source['notifications'],
    ['messages', 'trajets', 'paiements'],
    errors,
    'notifications'
  ) as PreferencesInput['notifications'];

  const privacy = readGroup(
    source['privacy'],
    ['fullName', 'photo', 'trips'],
    errors,
    'privacy'
  ) as PreferencesInput['privacy'];

  let language: string | undefined;

  if (source['language'] !== undefined) {
    const value = toStringOrNull(source['language']) ?? '';

    if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(value)) {
      errors['language'] = 'Cette langue n’est pas disponible.';
    } else {
      language = value;
    }
  }

  return { data: { notifications, privacy, language }, errors };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Valide un changement de mot de passe.
 * Les règles de robustesse reprennent celles de l'inscription (8 à 128 caractères).
 */
export function validateChangePassword(body: unknown): {
  data: ChangePasswordInput;
  errors: FieldErrors;
} {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  const currentPassword = toStringOrNull(source['currentPassword']) ?? '';
  if (!currentPassword) {
    errors['currentPassword'] = 'Le mot de passe actuel est obligatoire.';
  }

  const newPassword = toStringOrNull(source['newPassword']) ?? '';
  if (!newPassword) {
    errors['newPassword'] = 'Le nouveau mot de passe est obligatoire.';
  } else if (newPassword.length < LIMITS.passwordMin) {
    errors['newPassword'] =
      `Le nouveau mot de passe doit contenir au moins ${LIMITS.passwordMin} caractères.`;
  } else if (newPassword.length > LIMITS.passwordMax) {
    errors['newPassword'] =
      `Le nouveau mot de passe ne doit pas dépasser ${LIMITS.passwordMax} caractères.`;
  }

  return { data: { currentPassword, newPassword }, errors };
}

export interface DeleteAccountInput {
  password: string;
}

/** Valide une demande de suppression de compte (mot de passe exigé). */
export function validateDeleteAccount(body: unknown): {
  data: DeleteAccountInput;
  errors: FieldErrors;
} {
  const source = asRecord(body);
  const errors: FieldErrors = {};
  const password = toStringOrNull(source['password']) ?? '';

  if (!password) {
    errors['password'] = 'Le mot de passe est obligatoire.';
  }

  return { data: { password }, errors };
}

/** Valide la création d'une conversation. */
export function validateCreateConversation(body: unknown): {
  data: CreateConversationInput;
  errors: FieldErrors;
} {
  const source = asRecord(body);
  const errors: FieldErrors = {};
  const userId = toStringOrNull(source['userId']) ?? '';

  if (!userId) {
    errors['userId'] = "Le destinataire est obligatoire.";
  }

  return { data: { userId }, errors };
}

/** Valide les données de connexion démo (le rôle seul est transmis). */
export function validateDemoLogin(body: unknown): { data: DemoLoginInput; errors: FieldErrors } {
  const source = asRecord(body);
  const errors: FieldErrors = {};
  const role = toStringOrNull(source['role']);

  if (!role) {
    errors['role'] = 'Le rôle de démonstration est obligatoire.';
  }

  return { data: { role: role ?? '' }, errors };
}

// -----------------------------------------------------------------------------
// Trajets
// -----------------------------------------------------------------------------

const IATA_REGEX = /^[A-Z]{3}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
/** Numéro de vol normalisé : code compagnie (2-3 lettres) + espace + numéro. */
const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3} \d{1,4}$/;

/** Convertit une valeur en nombre (accepte la virgule décimale française). */
function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
    if (normalized === '') {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/** Vérifie qu'un nombre ne porte pas plus de deux décimales. */
function hasMoreThanTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) > 1e-9;
}

/** Vérifie qu'une chaîne est une date calendaire au format AAAA-MM-JJ. */
function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Date du jour (fuseau du serveur) au format AAAA-MM-JJ. */
function localTodayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * Normalise un numéro de vol : majuscules, sans espaces superflus, avec un
 * espace unique entre le code compagnie et le numéro (« mk014 » → « MK 014 »).
 */
export function normalizeFlightNumber(value: string): string {
  const compact = value.trim().toUpperCase().replace(/\s+/g, '');
  const match = /^([A-Z]{2,3}?)(\d{1,4})$/.exec(compact);
  return match ? `${match[1]} ${match[2]}` : compact;
}

/** Valide les données de création d'un trajet. */
export function validateCreateTrajet(body: unknown): {
  data: CreateTrajetInput;
  errors: FieldErrors;
} {
  const source = asRecord(body);
  const errors: FieldErrors = {};

  // --- Itinéraire -----------------------------------------------------------
  const departIata = (toStringOrNull(source['departIata']) ?? '').toUpperCase();
  if (!departIata) {
    errors['departIata'] = "L'aéroport de départ est obligatoire.";
  } else if (!IATA_REGEX.test(departIata)) {
    errors['departIata'] = "L'aéroport de départ est invalide.";
  }

  const arriveeIata = (toStringOrNull(source['arriveeIata']) ?? '').toUpperCase();
  if (!arriveeIata) {
    errors['arriveeIata'] = "L'aéroport de destination est obligatoire.";
  } else if (!IATA_REGEX.test(arriveeIata)) {
    errors['arriveeIata'] = "L'aéroport de destination est invalide.";
  } else if (arriveeIata === departIata) {
    errors['arriveeIata'] = 'La destination doit être différente du départ.';
  }

  // --- Dates ----------------------------------------------------------------
  const dateDepart = toStringOrNull(source['dateDepart']) ?? '';
  if (!dateDepart) {
    errors['dateDepart'] = 'La date de départ est obligatoire.';
  } else if (!isValidIsoDate(dateDepart)) {
    errors['dateDepart'] = 'Le format de la date de départ est invalide.';
  } else if (dateDepart < localTodayIso()) {
    errors['dateDepart'] = 'La date de départ ne peut pas être dans le passé.';
  }

  const dateArrivee = toStringOrNull(source['dateArrivee']) ?? '';
  if (!dateArrivee) {
    errors['dateArrivee'] = "La date d'arrivée est obligatoire.";
  } else if (!isValidIsoDate(dateArrivee)) {
    errors['dateArrivee'] = "Le format de la date d'arrivée est invalide.";
  } else if (!errors['dateDepart'] && dateArrivee < dateDepart) {
    errors['dateArrivee'] = "La date d'arrivée doit être postérieure ou égale à la date de départ.";
  }

  // --- Poids disponible -----------------------------------------------------
  const poids = parseNumber(source['poidsDisponibleKg']);
  if (poids === null) {
    errors['poidsDisponibleKg'] = 'Le poids disponible est obligatoire.';
  } else if (poids <= 0) {
    errors['poidsDisponibleKg'] = 'Le poids disponible doit être supérieur à 0.';
  } else if (poids > TRAJET_LIMITS.maxWeightKg) {
    errors['poidsDisponibleKg'] = `Le poids disponible ne doit pas dépasser ${TRAJET_LIMITS.maxWeightKg} kg.`;
  } else if (hasMoreThanTwoDecimals(poids)) {
    errors['poidsDisponibleKg'] = 'Le poids disponible ne doit pas comporter plus de 2 décimales.';
  }

  // --- Prix par kg ----------------------------------------------------------
  const prix = parseNumber(source['prixParKg']);
  if (prix === null) {
    errors['prixParKg'] = 'Le prix par kg est obligatoire.';
  } else if (prix <= 0) {
    errors['prixParKg'] = 'Le prix par kg doit être supérieur à 0.';
  } else if (prix > TRAJET_LIMITS.maxPricePerKg) {
    errors['prixParKg'] = `Le prix par kg ne doit pas dépasser ${TRAJET_LIMITS.maxPricePerKg}.`;
  } else if (hasMoreThanTwoDecimals(prix)) {
    errors['prixParKg'] = 'Le prix par kg ne doit pas comporter plus de 2 décimales.';
  }

  // --- Vol ------------------------------------------------------------------
  const compagnieAerienne = toStringOrNull(source['compagnieAerienne']) ?? '';
  if (!compagnieAerienne) {
    errors['compagnieAerienne'] = 'La compagnie aérienne est obligatoire.';
  } else if (compagnieAerienne.length > TRAJET_LIMITS.airlineMaxLength) {
    errors['compagnieAerienne'] =
      `La compagnie aérienne ne doit pas dépasser ${TRAJET_LIMITS.airlineMaxLength} caractères.`;
  }

  const numeroVolRaw = toStringOrNull(source['numeroVol']) ?? '';
  const numeroVol = numeroVolRaw ? normalizeFlightNumber(numeroVolRaw) : '';
  if (!numeroVolRaw) {
    errors['numeroVol'] = 'Le numéro de vol est obligatoire.';
  } else if (
    numeroVol.length > TRAJET_LIMITS.flightNumberMaxLength ||
    !FLIGHT_NUMBER_REGEX.test(numeroVol)
  ) {
    errors['numeroVol'] = 'Le format du numéro de vol est invalide (ex. MK 014).';
  }

  // --- Informations supplémentaires -----------------------------------------
  const informationsSupplementaires = toStringOrNull(source['informationsSupplementaires']);
  if (
    informationsSupplementaires &&
    informationsSupplementaires.length > TRAJET_LIMITS.notesMaxLength
  ) {
    errors['informationsSupplementaires'] =
      `Les informations supplémentaires ne doivent pas dépasser ${TRAJET_LIMITS.notesMaxLength} caractères.`;
  }

  return {
    data: {
      departIata,
      arriveeIata,
      dateDepart,
      dateArrivee,
      poidsDisponibleKg: poids ?? 0,
      prixParKg: prix ?? 0,
      compagnieAerienne,
      numeroVol,
      informationsSupplementaires,
    },
    errors,
  };
}
