/** Rôles disponibles pour un utilisateur. */
export type UserRole = 'utilisateur' | 'administrateur';

/** Utilisateur connecté (identité + coordonnées). */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  /** URL de la photo de profil (relative à l'API), ou null → initiales. */
  photoUrl: string | null;
  /** Code de la langue de l'interface (ex. « fr »). */
  language: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

/** Statistiques agrégées du profil. */
export interface ProfileStats {
  /** Nombre total de colis publiés par l'utilisateur. */
  envois: number;
  /** Nombre de trajets publiés. */
  trajets: number;
  /** Nombre de colis encore en cours. */
  colisEnCours: number;
  /** Nombre d'avis reçus. */
  avis: number;
  /** Note moyenne reçue (1 décimale). */
  noteMoyenne: number;
  /** Fiabilité en pourcentage. */
  fiabilite: number;
}

/** Évaluation reçue par l'utilisateur. */
export interface Review {
  id: string;
  note: number;
  commentaire: string | null;
  /** Puces enregistrées avec l'évaluation (facultatif). */
  tags?: string[];
  auteur: {
    /** Nom de l'auteur, conforme à ses préférences de confidentialité. */
    displayName: string;
  };
  createdAt: string;
}

/** Profil complet renvoyé par `GET /api/users/me`. */
export interface Profile extends User {
  stats: ProfileStats;
  derniersAvis: Review[];
}

/** Page d'évaluations renvoyée par `GET /api/users/me/reviews`. */
export interface ReviewPage {
  items: Review[];
  total: number;
  limit: number;
  offset: number;
}

/** Réponse renvoyée par l'API après connexion ou inscription. */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Données modifiables du profil (nom complet, e-mail, téléphone, adresse). */
export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
}

/** Rôles proposés par l'accès démonstration. */
export type DemoRole = 'expediteur' | 'voyageur' | 'admin';

/** Compte de démonstration exposé par l'API (libellé uniquement, sans identifiant). */
export interface DemoAccount {
  role: DemoRole;
  label: string;
}

/** Réponse de `GET /api/auth/demo-accounts`. */
export interface DemoAccountsResponse {
  enabled: boolean;
  accounts: DemoAccount[];
}

/** Réponse de `GET /api/auth/me` (restauration de session). */
export interface MeResponse {
  user: User;
}

/** Identifiants saisis sur l'écran de connexion. */
export interface LoginCredentials {
  email: string;
  password: string;
}
