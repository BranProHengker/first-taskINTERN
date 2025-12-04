import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get token dari localStorage - cek berbagai kemungkinan key
  let token = localStorage.getItem('auth_token') || 
              localStorage.getItem('token') || 
              sessionStorage.getItem('token');
  
  console.log('[AuthInterceptor] Token from storage:', token ? 'Found' : 'Not found');
  
  if (token) {
    // Clone request dan add Authorization header
    const clonedReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('[AuthInterceptor] Token attached to:', req.url);
    return next(clonedReq);
  }
  
  console.warn('[AuthInterceptor] No token found, request sent without auth');
  return next(req);
};
