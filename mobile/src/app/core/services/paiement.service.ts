import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PaiementPage } from '../../shared/models/paiement.model';

/** Accès à l'historique des paiements de l'utilisateur connecté. */
@Injectable({ providedIn: 'root' })
export class PaiementService {
  private readonly http = inject(HttpClient);

  getMyPaiements(limit = 20, offset = 0): Observable<PaiementPage> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PaiementPage>(`${environment.apiUrl}/paiements/me`, { params });
  }
}
