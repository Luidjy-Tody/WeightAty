import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Données d'un signalement. */
export interface CreateSignalementPayload {
  cibleType: 'trajet' | 'colis';
  cibleId: string;
  motif: string;
  message: string | null;
}

/** Enregistrement d'un signalement. */
@Injectable({ providedIn: 'root' })
export class SignalementService {
  private readonly http = inject(HttpClient);

  create(payload: CreateSignalementPayload): Observable<{ id: string; createdAt: string }> {
    return this.http.post<{ id: string; createdAt: string }>(
      `${environment.apiUrl}/signalements`,
      payload
    );
  }
}
