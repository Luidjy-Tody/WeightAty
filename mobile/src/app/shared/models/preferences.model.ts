/** Préférences de notification (activées par défaut). */
export interface NotificationPreferences {
  /** Nouveaux messages reçus. */
  messages: boolean;
  /** Nouvelles demandes et changements de statut des trajets. */
  trajets: boolean;
  /** Rémunération libérée et paiements reçus. */
  paiements: boolean;
}

/** Préférences de confidentialité. */
export interface PrivacyPreferences {
  /** Afficher le nom complet (sinon « Prénom N. »). */
  fullName: boolean;
  /** Afficher la photo de profil. */
  photo: boolean;
  /** Afficher le nombre de voyages réalisés. */
  trips: boolean;
}

/** Préférences du compte renvoyées par l'API. */
export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  /** Code de la langue de l'interface (ex. « fr »). */
  language: string;
}

/** Mise à jour partielle des préférences. */
export interface UpdatePreferencesPayload {
  notifications?: NotificationPreferences;
  privacy?: PrivacyPreferences;
  language?: string;
}

/** Données du changement de mot de passe. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Langue proposée par l'application. */
export interface LanguageOption {
  code: string;
  label: string;
}

/**
 * Langues disponibles. Seul le français est proposé : les traductions
 * n'existent pas encore. Ajouter une entrée ici (et les traductions) suffira
 * à exposer la langue dans l'application.
 */
export const LANGUAGES: LanguageOption[] = [{ code: 'fr', label: 'Français' }];

/** Libellé d'une langue à partir de son code. */
export function languageLabel(code: string | null | undefined): string {
  if (!code) {
    return LANGUAGES[0]?.label ?? '';
  }

  return LANGUAGES.find((language) => language.code === code)?.label ?? code;
}
