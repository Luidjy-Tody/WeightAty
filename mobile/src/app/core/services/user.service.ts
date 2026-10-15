import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Profile, ReviewPage, UpdateProfilePayload } from '../../shared/models/user.model';
import type {
  ChangePasswordPayload,
  UpdatePreferencesPayload,
  UserPreferences,
} from '../../shared/models/preferences.model';

/**
 * Accès aux endpoints du profil de l'utilisateur connecté.
 * L'identité est déterminée par le jeton (aucun identifiant envoyé par le client).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /** Récupère le profil complet (identité, statistiques, dernières évaluations). */
  getMyProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${environment.apiUrl}/users/me`);
  }

  /** Enregistre les informations personnelles (nom complet, e-mail, téléphone, adresse). */
  updateMyProfile(payload: UpdateProfilePayload): Observable<Profile> {
    return this.http.put<Profile>(`${environment.apiUrl}/users/me`, payload);
  }

  /** Envoie la photo de profil (contenu base64 + type MIME). */
  uploadPhoto(data: string, mimeType: string): Observable<Profile> {
    return this.http.post<Profile>(`${environment.apiUrl}/users/me/photo`, { data, mimeType });
  }

  /** Supprime la photo de profil (retour aux initiales). */
  deletePhoto(): Observable<Profile> {
    return this.http.delete<Profile>(`${environment.apiUrl}/users/me/photo`);
  }

  /** Récupère les évaluations reçues (paginées). */
  getMyReviews(limit = 20, offset = 0): Observable<ReviewPage> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<ReviewPage>(`${environment.apiUrl}/users/me/reviews`, { params });
  }

  /** Préférences du compte (notifications, confidentialité, langue). */
  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${environment.apiUrl}/users/me/preferences`);
  }

  /** Met à jour (partiellement) les préférences du compte. */
  updatePreferences(payload: UpdatePreferencesPayload): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${environment.apiUrl}/users/me/preferences`, payload);
  }

  /** Change le mot de passe ; renvoie un nouveau jeton de session. */
  changePassword(payload: ChangePasswordPayload): Observable<{ token: string }> {
    return this.http.put<{ token: string }>(`${environment.apiUrl}/users/me/password`, payload);
  }

  /** Supprime (anonymise) le compte de l'utilisateur connecté. */
  deleteAccount(password: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/me`, { body: { password } });
  }
}
