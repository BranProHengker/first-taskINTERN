import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl;

  getUsers(): Observable<User[]> {
    return this.http.get(`${this.baseUrl}/api/User`, {
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      map(response => {
        const parsedResponse = this.parseResponse(response);
        // Handle possible response wrapper
        return Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse as any).content || [];
      })
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get(`${this.baseUrl}/api/User/${id}`, {
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      map(response => {
        const parsedResponse = this.parseResponse(response);
        return parsedResponse;
      })
    );
  }

  createUser(user: Partial<User>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.baseUrl}/api/User`, user, {
      headers,
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      map(response => this.parseResponse(response))
    );
  }

  private parseResponse(response: any): any {
    // If response is already an object (and not null), return it
    if (response && typeof response === 'object') {
      return response;
    }

    if (typeof response === 'string') {
      const clean = response.replace(/^\uFEFF/gm, "").trim();
      if (!clean) return null;

      try {
        let parsed = JSON.parse(clean);

        // Check for double encoding (if result is still a string that looks like JSON)
        if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            // If second parse fails, keep first result
          }
        }
        return parsed;
      } catch (e) {
        // If manual parsing fails, it might be a plain text success message (e.g. "Success", "Created")
        // Return the text instead of breaking
        return { success: true, message: clean, raw: clean };
      }
    }

    return response;
  }

  updateUser(user: Partial<User> & { id: number }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.baseUrl}/api/User/${user.id}`, user, {
      headers,
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      map(response => this.parseResponse(response))
    );
  }

  deleteUser(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.delete(`${this.baseUrl}/api/User/${id}`, {
      headers,
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      map(response => this.parseResponse(response))
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      oldPassword: oldPassword,
      newPassword: newPassword
    };

    return this.http.post(`${this.baseUrl}/api/User/ChangePassword`, body, {
      headers,
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      map(response => this.parseResponse(response))
    );
  }
}