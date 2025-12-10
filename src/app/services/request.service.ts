import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { Ticket } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private baseUrl = `${environment.apiUrl}/api/Request`;
  
  // Cache to support getById if endpoint doesn't support it
  private requestsCache: Ticket[] = [];
  
  private httpNoInterceptor: HttpClient;

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.httpNoInterceptor = new HttpClient(handler);
  }

  /**
   * Robust parsing helper.
   * Handles:
   * 1. Already parsed objects (if interceptor did it)
   * 2. JSON strings
   * 3. Double-encoded JSON strings
   * 4. BOM characters
   * 5. Plain text responses (treats as success if status is OK)
   */
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
        // If manual parsing fails, it might be a plain text success message (e.g. "Success", "Deleted")
        // Log warning but return the text instead of breaking
        console.warn('Manual JSON parse failed. Treat as plain text.', e);
        return { success: true, message: clean, raw: clean };
      }
    }
    
    return response;
  }

  getRequests(): Observable<Ticket[]> {
    // Force responseType: 'text' to bypass Angular's default JSON parser
    return this.http.get(this.baseUrl, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error('RequestService: getRequests failed', err)
      }),
      map(response => {
        const parsedResponse = this.parseResponse(response);
        // Handle possible response wrapper
        const rawData = Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse as any).content || [];

        const tickets = rawData.map((item: any) => {
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
            createDate: item.createdate || item.createDate,
            subject: item.requestNo || 'No Subject',
            description: item.description,
            createBy: item.createBy,
            roleName: item.roleName,
            service:item.serviceName,
            capture: item.capture || item.Capture,
            latitude: item.latitude,
            longitude: item.longitude
          };
        });

        this.requestsCache = tickets;
        return tickets.sort((a: Ticket, b: Ticket) => {
          const dateA = a.createDate ? new Date(a.createDate).getTime() : 0;
          const dateB = b.createDate ? new Date(b.createDate).getTime() : 0;
          return dateB - dateA;
        });
      })
    );
  }

  getRequestById(id: number): Observable<Ticket | undefined> {
    const cached = this.requestsCache.find(t => t.id == id);
    if (cached) {
      return of(cached);
    }
    return this.getRequests().pipe(
      map(tickets => tickets.find(t => t.id == id))
    );
  }

  getRequestDirectById(id: number): Observable<Ticket> {
    return this.http.get(`${this.baseUrl}/${id}`, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error(`RequestService: getRequestDirectById(${id}) failed`, err)
      }),
      map(response => {
        const parsed = this.parseResponse(response);

        // Handle the case where the API returns a single object instead of an array
        const item = parsed;

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

        // Map the response to Ticket interface, including details if available
        return {
          id: item.id,
          requestId: item.id,
          requestNo: item.requestNo,
          status: statusStr,
          note: item.note,
          createDate: item.createdate || item.createDate,
          subject: item.requestNo || 'No Subject',
          description: item.description,
          createBy: item.createBy,
          roleName: item.roleName,
          capture: item.capture || item.Capture,
          latitude: item.latitude,
          longitude: item.longitude,
          details: item.details || [] // Include details if available from the API response
        };
      })
    );
  }

  getRequestHistory(requestId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/Request/history/${requestId}`, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error(`RequestService: getRequestHistory(${requestId}) failed`, err)
      }),
      map(response => this.parseResponse(response))
    );
  }

  getEquipments(): Observable<any[]> {
    // Redundant but kept if needed, adding logs anyway
    return this.http.get(`${environment.apiUrl}/api/Equipment`, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error('RequestService: getEquipments failed', err)
      }),
      map(response => {
        const parsed = this.parseResponse(response);
        return Array.isArray(parsed) ? parsed : (parsed as any).content || [];
      })
    );
  }

  // getEquipmentById, createEquipment, updateEquipment, deleteEquipment removed in favor of EquipmentService

  getServices(): Observable<any[]> {
    return this.http.get(`${environment.apiUrl}/api/Service?row=82`, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error('RequestService: getServices failed', err)
      }),
      map(response => {
        const parsed = this.parseResponse(response);
        const rawData = Array.isArray(parsed) ? parsed : (parsed as any).content || [];
        return rawData.map((item: any) => ({
          id: item.id,
          serviceName: item.service || item.serviceName
        }));
      })
    );
  }

  getCaptureImage(filename: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/GetFile/${filename}`, {
      responseType: 'blob',
    }).pipe(
      tap({
        next: () => console.log(`RequestService: getCaptureImage(${filename}) success`),
        error: (err) => console.error(`RequestService: getCaptureImage(${filename}) failed`, err)
      })
    );
  }

  createRequest(ticketData: any): Observable<any> {
    // Return regular post without observing full response to match original setup
    // but keep enhanced error handling
    return this.http.post(this.baseUrl, ticketData, {
      responseType: 'text'
    }).pipe(
      tap({
        error: (err) => {
          console.error('RequestService: createRequest failed', err);
          // Log the error response body if available
          if (err.error) {
            console.error('Error response body:', err.error);
          }
        }
      }),
      map(response => this.parseResponse(response))
    );
  }

  updateRequest(ticket: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/Request`, ticket, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error('RequestService: updateRequest failed', err)
      }),
      map(response => this.parseResponse(response))
    );
  }

  updateTicketStatus(id: number, status: number): Observable<any> {
    const payload = {
      requestId: id,
      status: status.toString(),
      createDate: new Date().toISOString(),
      note: '',
      createBy: 0
    };
    return this.http.post(`${this.baseUrl}/updateStatus`, payload, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error('RequestService: updateTicketStatus failed', err)
      }),
      map(response => this.parseResponse(response))
    );
  }

  addTicketNote(id: number, note: string, status: string): Observable<any> {
    const payload = {
      requestId: id,
      status: status,
      note: note,
      createDate: new Date().toISOString(),
      createBy: 0
    };
    return this.http.post(`${this.baseUrl}/updateStatus`, payload, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error('RequestService: addTicketNote failed', err)
      }),
      map(response => this.parseResponse(response))
    );
  }

  deleteRequest(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Request/${id}`, { responseType: 'text' }).pipe(
      tap({
        error: (err) => console.error(`RequestService: deleteRequest(${id}) failed`, err)
      }),
      map(response => this.parseResponse(response))
    );
  }

  // --- Role CRUD ---

  getRoles(): Observable<any[]> {
    // Using text response type for consistency and safety
    return this.http.get<any[]>(`http://192.168.5.200:60776/api/Role`, { responseType: 'text' as 'json' }).pipe(
      tap({
        error: (err) => {
          if (err.status === 401) {
            console.warn('RequestService: Authentication required for getRoles');
          } else {
            console.error('RequestService: getRoles failed', err);
          }
        }
      }),
      map(res => {
         const parsed = this.parseResponse(res);
         return Array.isArray(parsed) ? parsed : (parsed as any).content || [];
      })
    );
  }

  getRoleById(id: number): Observable<any> {
    return this.http.get(`http://192.168.5.200:60776/api/Role/${id}`, { responseType: 'text' }).pipe(
        tap({
          next: (res) => console.log(`RequestService: getRoleById(${id}) raw success`, res),
          error: (err) => console.error(`RequestService: getRoleById(${id}) failed`, err)
        }),
        map(res => this.parseResponse(res))
    );
  }

  createRole(role: any): Observable<any> {
    return this.http.post('http://192.168.5.200:60776/api/Role', role, { responseType: 'text' }).pipe(
        tap({
          next: (res) => console.log('RequestService: createRole raw success', res),
          error: (err) => console.error('RequestService: createRole failed', err)
        }),
        map(res => this.parseResponse(res))
    );
  }

  updateRole(role: any): Observable<any> {
    return this.http.put('http://192.168.5.200:60776/api/Role', role, { responseType: 'text' }).pipe(
        tap({
          next: (res) => console.log('RequestService: updateRole raw success', res),
          error: (err) => console.error('RequestService: updateRole failed', err)
        }),
        map(res => this.parseResponse(res))
    );
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Role/${id}`, { responseType: 'text' }).pipe(
        tap({
          next: (res) => console.log(`RequestService: deleteRole(${id}) raw success`, res),
          error: (err) => console.error(`RequestService: deleteRole(${id}) failed`, err)
        }),
        map(res => this.parseResponse(res))
    );
  }
}