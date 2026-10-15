import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AuthResponse,
  DemoAccountsResponse,
  DemoRole,
  MeResponse,
  User,
} from '../../shared/models/user.model';
import { SKIP_AUTH_REDIRECT } from '../interceptors/http-context';
import { TokenStorageService } from './token-storage.service';

/** Délai maximal accordé à la restauration de session au démarrage. */
const SESSION_RESTORE_TIMEOUT_MS = 8000;

/**
 * Gestion de la session : connexion, connexion démo, déconnexion,
 * restauration au démarrage et utilisateur courant.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorageService);

  private readonly currentUserSignal = signal<User | null>(null);

  /** Utilisateur connecté (null tant que la session n'a pas été restaurée). */
  readonly currentUser = this.currentUserSignal.asReadonly();

  /** Indique si un jeton de session est présent. */
  isAuthenticated(): boolean {
    return this.tokens.getToken() !== null;
  }

  /** Met en cache l'utilisateur courant (après connexion ou chargement du profil). */
  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
  }

  /**
   * Remplace le jeton de session (après un changement de mot de passe : le
   * serveur renvoie un nouveau jeton pour prolonger la session courante).
   */
  updateToken(token: string): void {
    this.tokens.setToken(token);
  }

  /** Connexion par e-mail et mot de passe. */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(map((response) => this.remember(response)));
  }

  /**
   * Connexion avec un compte de démonstration.
   * Seul le rôle est transmis : aucun identifiant n'est présent côté client.
   */
  demoLogin(role: DemoRole): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/demo-login`, { role })
      .pipe(map((response) => this.remember(response)));
  }

  /** Liste les rôles de démonstration disponibles (vide si l'accès est désactivé). */
  getDemoAccounts(): Observable<DemoAccountsResponse> {
    return this.http.get<DemoAccountsResponse>(`${environment.apiUrl}/auth/demo-accounts`);
  }

  /**
   * Restaure la session au démarrage : valide le jeton enregistré auprès de
   * l'API et charge l'utilisateur courant. Un jeton invalide ou révoqué est
   * supprimé ; une indisponibilité réseau conserve la session locale.
   */
  restoreSession(): Observable<User | null> {
    if (!this.isAuthenticated()) {
      return of(null);
    }

    const context = new HttpContext().set(SKIP_AUTH_REDIRECT, true);

    return this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`, { context }).pipe(
      tap((response) => this.currentUserSignal.set(response.user)),
      map((response) => response.user),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.tokens.clearToken();
          this.currentUserSignal.set(null);
        }
        return of(null);
      }),
      timeout(SESSION_RESTORE_TIMEOUT_MS),
      catchError(() => of(null))
    );
  }

  /**
   * Déconnexion : révoque le jeton côté serveur (au mieux) puis nettoie
   * le stockage local et l'utilisateur en mémoire.
   */
  logout(): void {
    if (this.tokens.getToken()) {
      this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).subscribe({
        error: () => undefined,
      });
    }

    this.tokens.clearToken();
    this.currentUserSignal.set(null);
  }

  /** Enregistre le jeton et l'utilisateur renvoyés par l'API. */
  private remember(response: AuthResponse): User {
    this.tokens.setToken(response.token);
    this.currentUserSignal.set(response.user);
    return response.user;
  }
}
