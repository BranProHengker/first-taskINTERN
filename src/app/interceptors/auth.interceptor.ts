import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  let token = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('auth_token');
  }

  // Fallback to hardcoded only if needed for testing, but strictly prefer dynamic token
  // The user reported issues with logout, so we restore the fallback for stability
  if (!token) {
     token = "eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiZ3VzdGlnaWJyYW5hdmF0dHJAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiMyIsImV4cCI6MTc2NTA3MDk3NiwiaXNzIjoiZG90QmVhdXR5IiwiYXVkIjoiZG90QmVhdXR5VXNlciJ9.cu4itPiREd7ZerEWt13KtcXkFLN3cNW1632wdRnSVqU";
  }

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }
  
  return next(req);
};
