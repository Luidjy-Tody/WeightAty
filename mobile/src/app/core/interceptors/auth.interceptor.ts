import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Ajoute l'en-tête `Authorization: Bearer <token>` aux appels vers l'API
 * Weight'Aty lorsque l'utilisateur est connecté.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenStorageService).getToken();

  if (token && request.url.startsWith(environment.apiUrl)) {
    return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }

  return next(request);
};
