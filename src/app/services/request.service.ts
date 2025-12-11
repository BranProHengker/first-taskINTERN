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


  getRequests(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.baseUrl).pipe(
      tap({
        error: (err) => console.error('RequestService: getRequests failed', err)
      }),
      map(response => {
        // Handle possible response wrapper
        const rawData = Array.isArray(response) ? response : (response as any).content || [];

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
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`).pipe(
      tap({
        error: (err) => console.error(`RequestService: getRequestDirectById(${id}) failed`, err)
      }),
      map(response => {
        // Handle the case where the API returns a single object instead of an array
        const item = response;

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
          createDate: item.createDate || item.createDate,
          subject: item.requestNo || 'No Subject',
          description: item.description,
          createBy: item.createBy,
          roleName: item.roleName,
          capture: item.capture || item.capture,
          latitude: item.latitude,
          longitude: item.longitude,
          details: item.details || [] // Include details if available from the API response
        };
      })
    );
  }

  getRequestHistory(requestId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/Request/history/${requestId}`).pipe(
      tap({
        error: (err) => console.error(`RequestService: getRequestHistory(${requestId}) failed`, err)
      })
    );
  }

  getEquipments(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/Equipment`).pipe(
      tap({
        error: (err) => console.error('RequestService: getEquipments failed', err)
      }),
      map(response => {
        return Array.isArray(response) ? response : (response as any).content || [];
      })
    );
  }

  // getEquipmentById, createEquipment, updateEquipment, deleteEquipment removed in favor of EquipmentService

  getServices(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/Service?row=82`).pipe(
      tap({
        error: (err) => console.error('RequestService: getServices failed', err)
      }),
      map(response => {
        const rawData = Array.isArray(response) ? response : (response as any).content || [];
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
    // Need to handle formData differently - backend might return plain text
    // instead of JSON, so we'll override the response type
    return this.http.post(this.baseUrl, ticketData, {
      // Expect text response in case backend doesn't send proper JSON
      responseType: 'text',
      // Override content-type so browser sets the correct boundary for multipart/form-data
      headers: {}
    }).pipe(
      map(response => {
        // Try to parse response as JSON, but handle plain text as well
        if (!response) {
          // If there's no response body, return empty object
          return {};
        }

        try {
          // Attempt to parse response as JSON
          return JSON.parse(response);
        } catch (e) {
          // If parsing fails, return the raw response
          console.warn('Response is not valid JSON:', response);
          return { rawResponse: response };
        }
      }),
      tap({
        error: (err) => {
          console.error('RequestService: createRequest failed', err);
          // Log the error response body if available
          if (err.error) {
            console.error('Error response body:', err.error);
          }
        }
      })
    );
  }

  updateRequest(ticket: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/Request`, ticket).pipe(
      tap({
        error: (err) => console.error('RequestService: updateRequest failed', err)
      })
    );
  }

  updateTicketStatus(id: number, status: number): Observable<any> {
    const payload = {
      requestId: id,
      status: status,
      note: '', // Default empty note
      createBy: 0 // Default value
    };
    console.log('RequestService: updateTicketStatus payload', payload);
    return this.http.post(`${this.baseUrl}/updateStatus`, payload).pipe(
      tap({
        next: (res) => console.log('RequestService: updateTicketStatus success', res),
        error: (err) => console.error('RequestService: updateTicketStatus failed', err)
      })
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
    return this.http.post(`${this.baseUrl}/updateStatus`, payload).pipe(
      tap({
        error: (err) => console.error('RequestService: addTicketNote failed', err)
      })
    );
  }

  deleteRequest(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Request/${id}`, {
      // Don't expect JSON response which might cause parsing errors
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        // Return a simple success indicator
        return { success: true, status: response.status };
      }),
      tap({
        next: (res) => console.log(`RequestService: deleteRequest(${id}) success`, res),
        error: (err) => console.error(`RequestService: deleteRequest(${id}) failed`, err)
      })
    );
  }

  // --- Role CRUD ---

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`http://192.168.5.200:60776/api/Role`).pipe(
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
         return Array.isArray(res) ? res : (res as any).content || [];
      })
    );
  }

  getRoleById(id: number): Observable<any> {
    return this.http.get(`http://192.168.5.200:60776/api/Role/${id}`).pipe(
        tap({
          next: (res) => console.log(`RequestService: getRoleById(${id}) raw success`, res),
          error: (err) => console.error(`RequestService: getRoleById(${id}) failed`, err)
        })
    );
  }

  createRole(role: any): Observable<any> {
    return this.http.post('http://192.168.5.200:60776/api/Role', role).pipe(
        tap({
          next: (res) => console.log('RequestService: createRole raw success', res),
          error: (err) => console.error('RequestService: createRole failed', err)
        })
    );
  }

  updateRole(role: any): Observable<any> {
    return this.http.put('http://192.168.5.200:60776/api/Role', role).pipe(
        tap({
          next: (res) => console.log('RequestService: updateRole raw success', res),
          error: (err) => console.error('RequestService: updateRole failed', err)
        })
    );
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`http://192.168.5.200:60776/api/Role/${id}`).pipe(
        tap({
          next: (res) => console.log(`RequestService: deleteRole(${id}) raw success`, res),
          error: (err) => console.error(`RequestService: deleteRole(${id}) failed`, err)
        })
    );
  }
}