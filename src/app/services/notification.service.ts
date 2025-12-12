import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface Notification {
  id: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/api/Notif`;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  /**
   * Retrieves notifications for a specific row/user
   * @param row The row/user identifier
   * @returns Observable<Notification[]>
   */
  getNotificationsByRow(row: number): Observable<Notification[]> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<Notification[]>(`${this.baseUrl}/readByRow/${row}`, { headers });
  }

  /**
   * Marks a notification as read
   * @param id The notification ID
   * @returns Observable<any>
   */
  markAsRead(id: number): Observable<any> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.baseUrl}/updateRead/${id}`, { headers });
  }

  /**
   * Retrieves the authentication token from localStorage
   * @returns string | null
   */
  private getAuthToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Counts unread notifications
   * @param notifications Array of notifications
   * @returns Number of unread notifications
   */
  countUnread(notifications: Notification[]): number {
    return notifications.filter(notification => !notification.isRead).length;
  }
}