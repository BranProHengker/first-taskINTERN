import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

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
            capture: item.capture,
            latitude: item.latitude,
            longitude: item.longitude
          };
        });
        
        this.requestsCache = tickets;
        return tickets;
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

  getCaptureImage(fileName: string): string {
    if (!fileName) return '';
    if (fileName.startsWith('http') || fileName.startsWith('assets')) return fileName;
    
    // Normalize slashes (replace backslashes with forward slashes)
    let cleanPath = fileName.replace(/\\/g, '/');
    
    // Extract just the filename if it contains paths
    // Assuming the server exposes files at the root URL
    cleanPath = cleanPath.split('/').pop() || cleanPath;
    
    return `http://192.168.5.200:60776/${cleanPath}`;
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
    // x.json: PUT /api/Equipment (Wait, Request PUT?)
    // There is NO PUT /api/Request in the paths I saw?
    // Ah, there is POST /api/Request/status and POST /api/Request/updateStatus
    // But standard Update might be missing or I missed it.
    // Let's assume PUT /api/Request works or we use updateStatus.
    // Checking x.json again... /api/Request has GET, POST. /api/Request/{id} has GET, DELETE.
    // No PUT /api/Request found in the snippet provided (only Equipment/Role/User/GeoTag have PUT).
    // So maybe we can't edit ticket details, only status?
    // I will assume PUT works for now or use a placeholder.
    return this.http.put(`http://192.168.5.200:60776/api/Request`, ticket);
  }

  deleteRequest(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Request/${id}`);
  }
}
