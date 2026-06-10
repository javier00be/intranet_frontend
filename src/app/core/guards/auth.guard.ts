import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  const user = authService.user();
  if (user?.rol === 'director') {
    router.navigate(['/director/dashboard']);
  } else if (user?.rol === 'profesor') {
    router.navigate(['/profesor/cursos']);
  } else if (user?.rol === 'padre') {
    router.navigate(['/padre/dashboard']);
  } else if (user?.rol === 'estudiante') {
    router.navigate(['/estudiante/cursos']);
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];
  const user = authService.user();

  if (user && requiredRoles.includes(user.rol)) {
    return true;
  }

  // Redirigir al dashboard apropiado según el rol
  if (user?.rol === 'director') {
    router.navigate(['/director/dashboard']);
  } else if (user?.rol === 'profesor') {
    router.navigate(['/profesor/cursos']);
  } else if (user?.rol === 'padre') {
    router.navigate(['/padre/dashboard']);
  } else if (user?.rol === 'estudiante') {
    router.navigate(['/estudiante/cursos']);
  } else {
    router.navigate(['/auth/login']);
  }
  return false;
};