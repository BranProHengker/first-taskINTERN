import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // If running on server, allow navigation to proceed (SSR)
  // The real check happens in the browser
  if (!isPlatformBrowser(platformId)) {
    return true; 
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login page with return url
  return router.createUrlTree(['/login']);
};
