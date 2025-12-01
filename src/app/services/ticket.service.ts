import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { Ticket } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  // User instructed to use /api/General/Pengguna for tickets
  private baseUrl = 'http://192.168.5.200:60776/api/General/Pengguna';
  
  // Cache to support getById if endpoint doesn't support it
  private ticketsCache: Ticket[] = [];

  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(response => {
        // Handle possible response wrapper
        const rawData = Array.isArray(response) ? response : (response as any).content || [];
        
        // Map 'notif' schema or whatever comes back to Ticket
        const tickets = rawData.map((item: any) => ({
          id: item.id,
          requestId: item.id, // Assuming ID is key
          status: item.isRead ? 'Closed' : 'Open', // Heuristic mapping
          note: item.message,
          createDate: item.createDate,
          subject: item.title || 'No Subject', // Mapping title to subject
          description: item.message, // Mapping message to description
          createBy: item.userId,
          roleName: 'User' // Default
        }));
        
        this.ticketsCache = tickets;
        return tickets;
      })
    );
  }

  getTicketById(id: number): Observable<Ticket | undefined> {
    // First check cache
    const cached = this.ticketsCache.find(t => t.id === id);
    if (cached) {
      return of(cached);
    }
    
    // If not in cache, fetch list and find (since we don't have a verified Detail endpoint for "Pengguna")
    return this.getTickets().pipe(
      map(tickets => tickets.find(t => t.id === id))
    );
  }

  getTicketHistory(requestId: number): Observable<any> {
    // Keeping this as is for now, or might need to disable if not applicable
    return this.http.get(`http://192.168.5.200:60776/api/Request/history/${requestId}`);
  }
}
