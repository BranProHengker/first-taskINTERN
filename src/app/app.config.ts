import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './interceptors/auth.interceptor';
import { jsonInterceptor } from './interceptors/json.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // provideClientHydration(withEventReplay()), // Disabled strict hydration as requested
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, jsonInterceptor]))
  ]
};
