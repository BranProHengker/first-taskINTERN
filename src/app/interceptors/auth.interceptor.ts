import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Hanya akses localStorage di browser, bukan di server
  let token: string | null = null;

  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('auth_token') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token');
  }

  console.log('[AuthInterceptor] Token from storage:', token ? 'Found' : 'Not found');

  if (token) {
    // Cek apakah request menggunakan FormData (multipart/form-data)
    // Jika FormData, jangan set Content-Type karena harus diatur otomatis
    if (req.body instanceof FormData) {
      // Hanya tambahkan Authorization header, biarkan Content-Type diatur otomatis
      const clonedReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('[AuthInterceptor] Token attached to FormData request:', req.url);
      return next(clonedReq);
    } else {
      // Untuk request biasa, tambahkan header Authorization dan Content-Type
      const clonedReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('[AuthInterceptor] Token attached to:', req.url);
      return next(clonedReq);
    }
  }

  console.warn('[AuthInterceptor] No token found, request sent without auth');
  return next(req);
};
