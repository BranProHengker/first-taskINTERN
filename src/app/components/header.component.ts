import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <header class="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#303841]/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
      <div class="flex items-center gap-3">
        <a [routerLink]="['/dashboard']" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-lg hover:bg-white/10 transition cursor-pointer text-gray-400 hover:text-white animate-hover-pulse" title="Back to Dashboard">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </a>
        <div class="animate-fade-in">
          <h1 class="text-xl font-bold text-white tracking-tight">Welcome, {{ currentUser?.name || 'User' }}</h1>
          <p class="text-xs text-gray-500 font-medium">Have a nice day!</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <!-- Notification Bell -->
        <div class="relative notification-container">
          <div (click)="toggleNotifications()" class="relative cursor-pointer">
            <button class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition hover:text-white animate-hover-pulse">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <!-- Unread Count Badge -->
            <span *ngIf="unreadCount > 0"
                  class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full border-2 border-[#303841]">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </div>

          <!-- Notification Dropdown -->
          <div *ngIf="showNotifications" class="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-panel border border-white/10 rounded-xl shadow-xl z-50 animate-slide-down notification-panel">
            <div class="px-4 py-3 border-b border-white/10">
              <h3 class="font-semibold text-white">Notifications</h3>
            </div>
            <div *ngIf="notifications.length === 0" class="p-4 text-center text-gray-400">
              No notifications
            </div>
            <div *ngFor="let notification of notifications; let i = index"
                 [class.border-b]="i < notifications.length - 1"
                 class="border-white/10 last:border-b-0">
              <div
                (click)="markAsRead(notification.id)"
                class="p-4 cursor-pointer hover:bg-white/5 transition flex items-start gap-3"
                [class.opacity-60]="notification.isRead">
                <div class="mt-0.5">
                  <svg *ngIf="!notification.isRead" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg *ngIf="notification.isRead" class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ notification.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ notification.createdAt | date:'short' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="h-8 w-[1px] bg-white/10"></div>
        <div class="relative dropdown-container" [class.open]="isDropdownOpen">
          <div (click)="toggleDropdown()" class="flex items-center gap-3 pl-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition animate-hover-pulse">
            <div class="text-right hidden md:block animate-fade-in">
              <p class="text-sm font-semibold text-white">{{ currentUser?.name || 'Guest' }}</p>
              <p class="text-xs text-gray-500">{{ currentUser?.roleName || 'Visitor' }}</p>
            </div>
            <div class="w-10 h-10 rounded-full p-[2px] animate-pulse-border" style="background: var(--color-primary)">
               <div class="w-full h-full rounded-full bg-[#303841] flex items-center justify-center">
                 <span class="text-sm font-bold text-white">{{ initials }}</span>
               </div>
            </div>
          </div>
          <div *ngIf="isDropdownOpen" class="absolute right-0 mt-2 w-48 glass-panel border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-slide-down">
            <a [routerLink]="['/profile']" (click)="closeDropdown()" class="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition cursor-pointer border-b border-white/10 last:border-b-0 animate-hover-pulse">
              <svg class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </a>
            <button (click)="logout()" class="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer animate-hover-pulse">
              <svg class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .animate-hover-pulse {
      transition: all 0.3s ease;
    }

    .animate-hover-pulse:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .animate-fade-in {
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-ping-slow {
      animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;
    }

    @keyframes ping {
      0% { transform: scale(1); opacity: 1; }
      75%, 100% { transform: scale(1.5); opacity: 0; }
    }

    .animate-pulse-border {
      animation: pulseBorder 2s infinite;
    }

    @keyframes pulseBorder {
      0%, 100% { box-shadow: 0 0 0 0 rgba(215, 35, 35, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(215, 35, 35, 0); }
    }

    .animate-slide-down {
      animation: slideDown 0.3s ease-out;
      transform-origin: top center;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .glass-panel {
      background: rgba(48, 56, 65, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
  `]
})
export class HeaderComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  currentUser = this.authService.getCurrentUser();
  isDropdownOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;

  get initials(): string {
    return this.currentUser?.name?.substring(0, 2).toUpperCase() || 'GU';
  }

  ngOnInit() {
    if (this.currentUser) {
      // Using userId from the current user, falling back to a default value if not available
      const userId = this.currentUser.userId || 1; // Using userId from the LoginResponse
      this.loadNotifications(userId);
    }
  }

  loadNotifications(userId: number) {
    this.notificationService.getNotificationsByRow(userId).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadCount = this.notificationService.countUnread(notifications);
      },
      error: (error) => {
        console.error('Error fetching notifications:', error);
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notificationId: number) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        // Update the local notification state
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
          this.unreadCount = this.notificationService.countUnread(this.notifications);
        }

        // Hide notifications panel after clicking one
        this.showNotifications = false;
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    // Hide notifications panel when opening user dropdown
    this.showNotifications = false;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  logout() {
    this.authService.logout();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const notificationPanel = document.querySelector('.notification-panel');

    if (!target.closest('.dropdown-container') &&
        !target.closest('.notification-container') &&
        (this.isDropdownOpen || this.showNotifications)) {

      if (this.isDropdownOpen) {
        this.closeDropdown();
      }

      if (this.showNotifications) {
        this.showNotifications = false;
      }
    }
  }
}