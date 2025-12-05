import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = 'http://192.168.5.200:60776/api/User';

  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl).pipe(
      tap({
        next: (data) => console.log('UserService: getUsers success', data),
        error: (err) => console.error('UserService: getUsers failed', err)
      }),
      catchError((err) => {
        console.error('UserService: getUsers error details', err);
        // Handle 401 or other errors gracefully to prevent app crash
        console.warn('UserService: returning empty list due to error');
        return of([]);
      })
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`).pipe(
      tap({
        next: (data) => console.log(`UserService: getUserById(${id}) success`, data),
        error: (err) => console.error(`UserService: getUserById(${id}) failed`, err)
      })
    );
  }

  createUser(user: Partial<User>): Observable<string> {
    return this.http.post(this.baseUrl, user, { responseType: 'text' }).pipe(
      tap({
        next: (res) => console.log('UserService: createUser success', res),
        error: (err) => console.error('UserService: createUser failed', err)
      })
    );
  }

  updateUser(user: Partial<User>): Observable<string> {
    return this.http.put(this.baseUrl, user, { responseType: 'text' }).pipe(
      tap({
        next: (res) => console.log('UserService: updateUser success', res),
        error: (err) => console.error('UserService: updateUser failed', err)
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { responseType: 'text' as 'json' }).pipe(
      tap({
        next: () => console.log(`UserService: deleteUser(${id}) success`),
        error: (err) => console.error(`UserService: deleteUser(${id}) failed`, err)
      })
    );
  }
}
