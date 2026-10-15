import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// TODO: remplacer par l'URL de l'API (environment) quand l'équipe l'aura définie.
const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'p2ppost_token';

export interface RegisterPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
}

export interface LoginPayload {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  token: string;
}

/**
 * Fichier commun WAT-21 (inscription) et WAT-22 (connexion) :
 * prévenir l'équipe avant de le modifier.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  register(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(`${API_URL}/auth/register`, payload);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, payload)
      .pipe(tap((res) => localStorage.setItem(TOKEN_KEY, res.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
