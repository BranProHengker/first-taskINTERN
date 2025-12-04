import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly baseUrl = 'http://192.168.5.200:60776/api/Role';

  constructor(private readonly http: HttpClient) {}

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getRoleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createRole(role: any): Observable<string> {
    return this.http.post(this.baseUrl, role, { responseType: 'text' });
  }

  updateRole(role: any): Observable<string> {
    return this.http.put(this.baseUrl, role, { responseType: 'text' });
  }

  deleteRole(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}