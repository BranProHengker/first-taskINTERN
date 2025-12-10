import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceModel } from '../models/service.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private readonly baseUrl = 'http://192.168.5.200:60776/api/Service';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ServiceModel[]> {
    return this.http.get<ServiceModel[]>(this.baseUrl);
  }

  getById(id: number): Observable<ServiceModel> {
    return this.http.get<ServiceModel>(`${this.baseUrl}/${id}`);
  }
}