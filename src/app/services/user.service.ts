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
    return this.http.get<User[]>(`${this.baseUrl}/api/User`).pipe(
      map(response => {
        // Handle possible response wrapper
        if (Array.isArray(response)) {
          return response;
        } else if (response && Array.isArray((response as any).content)) {
          return (response as any).content;
        } else if (response && typeof response === 'object') {
          // Check for common wrapper properties
          if ((response as any).data && Array.isArray((response as any).data)) {
            return (response as any).data;
          } else if ((response as any).content && Array.isArray((response as any).content)) {
            return (response as any).content;
          } else if ((response as any).users && Array.isArray((response as any).users)) {
            return (response as any).users;
          } else if ((response as any).result && Array.isArray((response as any).result)) {
            return (response as any).result;
          } else {
            // Try to find any array property in the object
            const arrayProps = Object.keys(response).filter(key => Array.isArray((response as any)[key]));
            if (arrayProps.length > 0) {
              const firstArrayProp = arrayProps[0];
              return (response as any)[firstArrayProp];
            } else {
              return [];
            }
          }
        } else {
          return [];
        }
      })
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/api/User/${id}`);
  }

  createUser(user: Partial<User>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.baseUrl}/api/User`, user, { headers });
  }

  updateUser(user: Partial<User> & { id: number }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Use POST to base endpoint with ID in the body - common pattern when API doesn't support PUT/PATCH
    // The API likely determines whether to create or update based on the presence of an ID in the data
    const userData = { ...user, id: user.id };
    return this.http.put(`${this.baseUrl}/api/User`, userData, {
      headers,
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        // Return a simple success indicator
        return { success: true, status: response.status };
      })
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/User/${id}`, {
      // Don't expect JSON response which might cause parsing errors
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        // Return a simple success indicator
        return { success: true, status: response.status };
      })
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

    // Using responseType 'text' to handle non-JSON responses that might cause JSON.parse errors
    return this.http.post(`${this.baseUrl}/api/User/ChangePassword`, body, {
      headers,
      responseType: 'text' // Handle response as text to prevent JSON parsing errors
    }).pipe(
      map(response => {
        // If response is empty, return a success message
        if (!response) {
          return { message: 'Password changed successfully' };
        }

        // Try to parse as JSON if it's a valid JSON string, otherwise return as text
        try {
          return JSON.parse(response);
        } catch (e) {
          // If it's not valid JSON, return the text response as a message
          return { message: response || 'Password changed successfully' };
        }
      })
    );
  }
}