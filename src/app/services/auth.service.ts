import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { User, LoginRequest, LoginResponse } from '../models/user.model';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://192.168.5.200:60776/api/General';
  private readonly TOKEN_KEY = 'auth_token'; 
  private readonly USER_KEY = 'auth_user';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private router: Router) {}

  login(emailAddress: string, password?: string): Observable<LoginResponse> {
    const payload: LoginRequest = { emailAddress, password };
    return this.http.post<LoginResponse>(`${this.baseUrl}/Login`, payload).pipe(
      tap((response) => {
        if (response.success && (response.accessToken || (response as any).token)) {
          if (isPlatformBrowser(this.platformId)) {
            const token = response.accessToken || (response as any).token;
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(response));
          }
        }
      })
    );
  }

  register(user: Partial<User>): Observable<any> {
    return this.http.post(`${this.baseUrl}/Register`, user, { responseType: 'text' }).pipe(
      map(res => {
        // Basic parsing for simple responses
        try { return JSON.parse(res); } catch(e) { return res; }
      })
    );
  }

  // createUser, updateUser, deleteUser, getUsers removed in favor of UserService

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.TOKEN_KEY);
      return !!token;
    }
    return false; 
  }

  getCurrentUser(): LoginResponse | null {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  getPengguna(): Observable<any[]> {
    // Using responseType: 'text' to handle potential non-JSON responses safely
    return this.http.get<any[]>(`${this.baseUrl}/Pengguna`, { responseType: 'text' as 'json' }).pipe(
      map((response: any) => {
        let parsed: any = response;
        if (typeof response === 'string') {
           const clean = response.replace(/^\uFEFF/gm, "").trim();
           try {
             parsed = JSON.parse(clean);
             if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch(e) {}
             }
           } catch(e) {
             console.warn('Pengguna JSON parse failed', e);
             return [];
           }
        }
        return Array.isArray(parsed) ? parsed : (parsed as any).content || [];
      })
    );
  }
}
