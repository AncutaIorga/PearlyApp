import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // Si es 401, redirigir al login
      if (error.status === 401) {
        localStorage.clear();
        router.navigate(['/login']);
      }

      // Si es 403, mostrar mensaje de permisos
      if (error.status === 403) {
        console.error('No tienes permisos para esta acción');
      }

      return throwError(() => error);
    })
  );
};