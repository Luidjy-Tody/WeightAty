import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Airport,
  AirportSearchResponse,
  CreateTrajetPayload,
  Trajet,
  TrajetDetail,
  TrajetPage,
} from '../../shared/models/trajet.model';
import type { ReviewPage } from '../../shared/models/user.model';

/** Accès aux trajets et aux aéroports de référence. */
@Injectable({ providedIn: 'root' })
export class TrajetService {
  private readonly http = inject(HttpClient);

  /** Recherche d'aéroports / villes pour l'autocomplétion. */
  searchAirports(query: string, limit = 8): Observable<Airport[]> {
    const params = new HttpParams().set('q', query).set('limit', limit);
    return this.http
      .get<AirportSearchResponse>(`${environment.apiUrl}/airports`, { params })
      .pipe(map((response) => response.items));
  }

  /** Publie un trajet pour l'utilisateur connecté. */
  createTrajet(payload: CreateTrajetPayload): Observable<Trajet> {
    return this.http.post<Trajet>(`${environment.apiUrl}/trajets`, payload);
  }

  /** Trajets publiés par l'utilisateur connecté. */
  getMyTrajets(): Observable<TrajetPage> {
    return this.http.get<TrajetPage>(`${environment.apiUrl}/trajets/me`);
  }

  /** Détail d'un trajet (voyageur, droits de l'appelant). */
  getTrajet(id: string): Observable<TrajetDetail> {
    return this.http.get<TrajetDetail>(`${environment.apiUrl}/trajets/${id}`);
  }

  /** Avis publics reçus par un membre. */
  getUserReviews(userId: string, limit = 20, offset = 0): Observable<ReviewPage> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<ReviewPage>(`${environment.apiUrl}/users/${userId}/reviews`, { params });
  }
}
