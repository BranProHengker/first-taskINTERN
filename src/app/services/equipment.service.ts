import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private readonly baseUrl = 'http://192.168.5.200:60776/api/Equipment';

  constructor(private readonly http: HttpClient) {}

  getEquipments(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      tap({
        error: (err) => console.error('EquipmentService: getEquipments failed', err)
      })
    );
  }

  getEquipmentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap({
        error: (err) => console.error(`EquipmentService: getEquipmentById(${id}) failed`, err)
      })
    );
  }

  createEquipment(equipment: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(this.baseUrl, equipment, {
      headers,
      observe: 'response',
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      tap({
        next: (res) => console.log('EquipmentService: createEquipment success', res),
        error: (err) => console.error('EquipmentService: createEquipment failed', err)
      })
    );
  }

  updateEquipment(equipment: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put(this.baseUrl, equipment, {
      headers,
      observe: 'response',
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      tap({
        next: (res) => console.log('EquipmentService: updateEquipment success', res),
        error: (err) => console.error('EquipmentService: updateEquipment failed', err)
      })
    );
  }

  deleteEquipment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      observe: 'response',
      responseType: 'text' // Handle text response to prevent parsing errors
    }).pipe(
      tap({
        next: () => console.log(`EquipmentService: deleteEquipment(${id}) success`),
        error: (err) => console.error(`EquipmentService: deleteEquipment(${id}) failed`, err)
      })
    );
  }
}
