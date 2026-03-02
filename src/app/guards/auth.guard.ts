import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/authBACK';

// Impide el acceso a paginas privadas si el usuario no ha iniciado sesion.
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};