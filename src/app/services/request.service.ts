import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { Ticket } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  // User instructed to use /api/Request for tickets
  private baseUrl = 'http://192.168.5.200:60776/api/Request';
  
  // Cache to support getById if endpoint doesn't support it
  private requestsCache: Ticket[] = [];
  
  private httpNoInterceptor: HttpClient;

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.httpNoInterceptor = new HttpClient(handler);
  }

  getRequests(): Observable<Ticket[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(response => {
        // Handle possible response wrapper
        const rawData = Array.isArray(response) ? response : (response as any).content || [];
        
        const tickets = rawData.map((item: any) => {
          // Map numeric status to string if necessary (handle string numbers too)
          const statusNum = Number(item.status);
          let statusStr = item.status;

          if (!isNaN(statusNum) && item.status !== null && item.status !== '') {
             switch(statusNum) {
                case 1: statusStr = 'Open'; break;
                case 2: statusStr = 'In Progress'; break;
                case 3: statusStr = 'Reject'; break;
                case 4: statusStr = 'Closed'; break;
                default: statusStr = 'Open';
             }
          } else if (!item.status) {
             statusStr = 'Open';
          }

          return {
            id: item.id,
            requestId: item.id,
            requestNo: item.requestNo,
            status: statusStr,
            note: item.note,
            createDate: item.createdate || item.createDate, // Handle lowercase 'd' from API
            subject: item.requestNo || 'No Subject', // Use requestNo as subject
            description: item.description,
            createBy: item.createBy,
            roleName: item.roleName,
            capture: item.capture || item.Capture, // Handle possible uppercase
            latitude: item.latitude,
            longitude: item.longitude
          };
        });
        
        this.requestsCache = tickets;
        // Sort by date descending (newest first)
        return tickets.sort((a: Ticket, b: Ticket) => {
          const dateA = a.createDate ? new Date(a.createDate).getTime() : 0;
          const dateB = b.createDate ? new Date(b.createDate).getTime() : 0;
          return dateB - dateA;
        });
      })
    );
  }

  getRequestById(id: number): Observable<Ticket | undefined> {
    // First check cache
    const cached = this.requestsCache.find(t => t.id == id); // Use loose equality for string/number mismatch
    if (cached) {
      return of(cached);
    }
    
    // If not in cache, fetch list and find (since we don't have a verified Detail endpoint for "Pengguna")
    return this.getRequests().pipe(
      map(tickets => tickets.find(t => t.id == id))
    );
  }

  

  getRequestHistory(requestId: number): Observable<any> {
    // Keeping this as is for now, or might need to disable if not applicable
    return this.http.get(`http://192.168.5.200:60776/api/Request/history/${requestId}`);
  }

  getEquipments(): Observable<any[]> {
    return this.http.get<any[]>('http://192.168.5.200:60776/api/Equipment');
  }

  getEquipmentById(id: number): Observable<any> {
    // Fallback to list filtering if direct endpoint is unreliable
    return this.getEquipments().pipe(
      map(equipments => equipments.find(e => e.id == id))
    );
  }

  createEquipment(equipment: any): Observable<any> {
    return this.http.post('http://192.168.5.200:60776/api/Equipment', equipment);
  }

  updateEquipment(equipment: any): Observable<any> {
    return this.http.put('http://192.168.5.200:60776/api/Equipment', equipment);
  }

  deleteEquipment(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Equipment/${id}`);
  }

  getServices(): Observable<any[]> {
    return this.http.get<any[]>('http://192.168.5.200:60776/api/Service?row=82').pipe(
      map(response => {
        const rawData = Array.isArray(response) ? response : (response as any).content || [];
        return rawData.map((item: any) => ({
          id: item.id,
          serviceName: item.service || item.serviceName // Handle 'service' from API, fallback to 'serviceName' if exists
        }));
      })
    );
  }

  getCaptureImage(filename: string): Observable<Blob> {
    // Use the raw filename directly as requested
    return this.http.get(`${this.baseUrl}/GetFile/${filename}`, {
      responseType: 'blob',
    });
  }

  createRequest(ticketData: any): Observable<any> {
    // Use FormData if the input contains a file (capture)
    // If the ticketData is already FormData, use it directly.
    // Otherwise, try to convert or send as JSON.
    
    if (ticketData instanceof FormData) {
        return this.http.post(this.baseUrl, ticketData);
    }

    // If we have a capture file in the object (which we shouldn't if we use FormData in component, 
    // but let's handle the case where we might want to construct FormData here)
    // For now, assuming component handles FormData construction if file exists.
    return this.http.post(this.baseUrl, ticketData);
  }

  updateRequest(ticket: any): Observable<any> {
    return this.http.put(`http://192.168.5.200:60776/api/Request`, ticket);
  }

  updateTicketStatus(id: number, status: number): Observable<any> {
    // x.json: POST /api/Request/updateStatus
    // Schema: RequestLog { id, requestId, status, note, createDate, createBy }
    const payload = {
      requestId: id,
      status: status.toString(),
      createDate: new Date().toISOString(),
      // Add other fields if required by backend validation, even if null
      note: '', 
      createBy: 0 // Backend likely overwrites or ignores this
    };
    return this.http.post(`${this.baseUrl}/updateStatus`, payload);
  }

  addTicketNote(id: number, note: string, status: string): Observable<any> {
    // Assuming Add Note also uses updateStatus endpoint but with a note content
    // Or if there is a specific AddNote, but I didn't see one. 
    // Using updateStatus as it has a 'note' field in RequestLog schema.
    // We need to preserve current status or allow changing it.
    
    // Map status string to ID if needed, or just pass what we have if backend accepts string (schema says string? No, schema says status is string in RequestLog but integer in ReadParam... let's check schema again)
    // RequestLog schema: status: string (nullable). 
    // Ticket schema: status: string.
    // But updateTicketStatus uses status.toString().
    
    const payload = {
      requestId: id,
      status: status, // Send current status string (or ID if backend requires conversion, but previously we sent "1", "2" etc strings)
      note: note,
      createDate: new Date().toISOString(),
      createBy: 0
    };
    return this.http.post(`${this.baseUrl}/updateStatus`, payload);
  }

  deleteRequest(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Request/${id}`);
  }

  // --- Role CRUD ---

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>('http://192.168.5.200:60776/api/Role');
  }

  getRoleById(id: number): Observable<any> {
    return this.http.get<any>(`http://192.168.5.200:60776/api/Role/${id}`);
  }

  createRole(role: any): Observable<any> {
    return this.http.post('http://192.168.5.200:60776/api/Role', role);
  }

  updateRole(role: any): Observable<any> {
    return this.http.put('http://192.168.5.200:60776/api/Role', role);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Role/${id}`);
  }
}
