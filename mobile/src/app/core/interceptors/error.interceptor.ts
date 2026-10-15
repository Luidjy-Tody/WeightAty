import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH_REDIRECT } from './http-context';

/**
 * Déconnecte l'utilisateur et le redirige vers l'écran de connexion
 * lorsqu'une requête authentifiée est refusée (jeton expiré ou révoqué).
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      const skipRedirect = request.context.get(SKIP_AUTH_REDIRECT);

      if (
        !skipRedirect &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        auth.isAuthenticated()
      ) {
        auth.logout();
        void router.navigate(['/auth/connexion'], {
          queryParams: { retour: router.url },
        });
      }

      return throwError(() => error);
    })
  );
};
