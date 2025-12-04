import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#303841]/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
      <div class="flex items-center gap-3">
        <!-- Burger Menu (Visible on all screens now) -->
        <button (click)="toggleSidebar.emit()" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <a [routerLink]="['/dashboard']" class="hidden md:flex w-10 h-10 rounded-xl bg-white/5 items-center justify-center shadow-lg hover:bg-white/10 transition cursor-pointer text-gray-400 hover:text-white" title="Back to Dashboard">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </a>
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight truncate max-w-[150px] md:max-w-none">Welcome, {{ currentUser?.name || 'User' }}</h1>
          <p class="text-xs text-gray-500 font-medium hidden md:block">Have a nice day!</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="relative">
          <span *ngIf="penggunaCount > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#303841] flex items-center justify-center text-[8px] font-bold text-white">{{ penggunaCount }}</span>
          <button (click)="toggleNotifications()" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>

          <!-- Notification Popup -->
          <div *ngIf="showNotifications" class="absolute right-0 mt-2 w-80 bg-[#2a2f35] border border-white/10 rounded-xl shadow-2xl p-4 z-50">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-white font-semibold">Notifications</h3>
              <button (click)="showNotifications = false" class="text-gray-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <!-- Notifications List -->
            <div *ngIf="penggunaList.length > 0; else noNotifications" class="space-y-3 max-h-96 overflow-y-auto">
              <div *ngFor="let pengguna of penggunaList" class="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition cursor-pointer border border-white/5">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">{{ pengguna?.name || 'Unknown' }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ pengguna?.email || 'no-email' }}</p>
                    <p class="text-xs text-gray-500 mt-1">Role: {{ pengguna?.roleName || 'No Role' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <ng-template #noNotifications>
              <div class="text-center py-8">
                <svg class="w-12 h-12 mx-auto text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V5a2 2 0 00-2-2H6a2 2 0 00-2 2v8" /></svg>
                <p class="text-sm text-gray-400">No notifications</p>
              </div>
            </ng-template>
          </div>
        </div>
        <div class="h-8 w-[1px] bg-white/10"></div>
        <div class="flex items-center gap-3 pl-2">
          <div class="text-right hidden md:block">
            <p class="text-sm font-semibold text-white">{{ currentUser?.name || 'Guest' }}</p>
            <p class="text-xs text-gray-500">{{ currentUser?.roleName || 'Visitor' }}</p>
          </div>
          <div class="w-10 h-10 rounded-full p-[2px]" style="background: var(--color-primary)">
             <div class="w-full h-full rounded-full bg-[#303841] flex items-center justify-center">
               <span class="text-sm font-bold text-white">{{ initials }}</span>
             </div>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  authService = inject(AuthService);
  currentUser = this.authService.getCurrentUser();
  penggunaCount = 0;
  penggunaList: any[] = [];
  showNotifications = false;

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.authService.getPengguna().subscribe({
      next: (data) => {
        this.penggunaList = data || [];
        this.penggunaCount = data ? data.length : 0;
      },
      error: (err) => console.error('Failed to load alerts', err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  get initials(): string {
    return this.currentUser?.name?.substring(0, 2).toUpperCase() || 'GU';
  }
}
