import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone request dan add headers
    const clonedReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return next.handle(clonedReq).pipe(
      tap(
        event => {
          if (event instanceof HttpResponse) {
            console.log('[HttpInterceptor] Response:', event.status, event.url, event.body);
          }
        }
      )
    );
  }
}
