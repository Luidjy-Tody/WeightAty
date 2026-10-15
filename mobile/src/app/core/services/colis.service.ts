import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ColisDetail,
  ColisPage,
  EtapeColis,
  Evaluation,
  Remuneration,
} from '../../shared/models/colis.model';

/** Données d'une évaluation de voyageur. */
export interface CreateEvaluationPayload {
  note: number;
  commentaire: string | null;
  tags: string[];
}

/** Accès aux colis de l'utilisateur et à leur suivi. */
@Injectable({ providedIn: 'root' })
export class ColisService {
  private readonly http = inject(HttpClient);

  /** Colis de l'utilisateur connecté (expéditeur), paginés. */
  getMyColis(limit = 20, offset = 0): Observable<ColisPage> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<ColisPage>(`${environment.apiUrl}/colis/me`, { params });
  }

  /** Détail et suivi d'un colis. */
  getColis(id: string): Observable<ColisDetail> {
    return this.http.get<ColisDetail>(`${environment.apiUrl}/colis/${id}`);
  }

  /** Enregistre l'étape suivante du suivi (voyageur). */
  advanceEtape(id: string, etape: EtapeColis): Observable<ColisDetail> {
    return this.http.post<ColisDetail>(`${environment.apiUrl}/colis/${id}/etapes`, { etape });
  }

  /** Confirme la remise au destinataire (expéditeur) et libère la rémunération. */
  confirmDelivery(id: string): Observable<ColisDetail> {
    return this.http.post<ColisDetail>(`${environment.apiUrl}/colis/${id}/livraison`, {});
  }

  /** Rémunération libérée pour un colis (voyageur). */
  getRemuneration(id: string): Observable<Remuneration> {
    return this.http.get<Remuneration>(`${environment.apiUrl}/colis/${id}/remuneration`);
  }

  /** Évalue le voyageur du colis (expéditeur). */
  evaluate(id: string, payload: CreateEvaluationPayload): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${environment.apiUrl}/colis/${id}/evaluation`, payload);
  }
}
