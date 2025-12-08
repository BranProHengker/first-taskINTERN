import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  createEquipment(equipment: any): Observable<string> {
    return this.http.post(this.baseUrl, equipment, { responseType: 'text' }).pipe(
      tap({
        next: (res) => console.log('EquipmentService: createEquipment success', res),
        error: (err) => console.error('EquipmentService: createEquipment failed', err)
      })
    );
  }

  updateEquipment(equipment: any): Observable<string> {
    return this.http.put(this.baseUrl, equipment, { responseType: 'text' }).pipe(
      tap({
        next: (res) => console.log('EquipmentService: updateEquipment success', res),
        error: (err) => console.error('EquipmentService: updateEquipment failed', err)
      })
    );
  }

  deleteEquipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { responseType: 'text' as 'json' }).pipe(
      tap({
        next: () => console.log(`EquipmentService: deleteEquipment(${id}) success`),
        error: (err) => console.error(`EquipmentService: deleteEquipment(${id}) failed`, err)
      })
    );
  }
}
