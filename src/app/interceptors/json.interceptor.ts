import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, throwError, of } from 'rxjs';

/**
 * Interceptor to handle JSON parsing for APIs that return text/plain or double-encoded JSON.
 * 
 * STRATEGY:
 * 1. If responseType is 'blob', do nothing.
 * 2. If responseType is 'text' (which we force in Service), let it pass through as string.
 *    The Service will handle the parsing safely.
 * 3. If responseType is 'json' (default), try to salvage if parsing fails.
 */
export const jsonInterceptor: HttpInterceptorFn = (req, next) => {

  // Skip blob requests
  if (req.responseType === 'blob') {
    return next(req);
  }

  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        // If we received a string body but the request might have expected JSON (or we just want to help),
        // we can try to clean it.
        // BUT, if the Service explicitly asked for 'text', we should probably leave it as text 
        // so the Service's parseResponse() can handle it deterministically.
        
        // However, to be helpful to components that didn't update to use RequestService parsing:
        if (typeof event.body === 'string') {
          // Only try to parse if it LOOKS like JSON
          const trimmed = event.body.trim();
          if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && req.responseType !== 'text') {
             // Only auto-parse if NOT requested as text.
             // If requested as text, the service expects a string.
             try {
               const parsed = JSON.parse(trimmed);
               return event.clone({ body: parsed });
             } catch (e) {
               // Ignore
             }
          }
        }
      }
      return event;
    }),
    catchError((error: HttpErrorResponse) => {
      // Handle the "200 OK but Parse Error" case
      if (error.status === 200) {
        const body = error.error || error.message;
        if (typeof body === 'string') {
           const cleanBody = body.replace(/^\uFEFF/gm, "").trim();
           try {
             // Try parsing
             let parsed = JSON.parse(cleanBody);
             // Handle double encoding
             if (typeof parsed === 'string') {
                 try { parsed = JSON.parse(parsed); } catch (e) {}
             }
             
             // Return success
             return of(new HttpResponse({
               body: parsed,
               status: 200,
               statusText: 'OK',
               url: error.url || undefined
             }));
           } catch (e) {
             // If parse fails, return as text body
             return of(new HttpResponse({
               body: cleanBody,
               status: 200,
               statusText: 'OK',
               url: error.url || undefined
             }));
           }
        }
      }
      return throwError(() => error);
    })
  );
};
