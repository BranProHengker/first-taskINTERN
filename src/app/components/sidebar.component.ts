import { Component, inject, Input, Output, EventEmitter, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside 
      [class.translate-x-0]="isOpen" 
      [class.-translate-x-full]="!isOpen"
      [class.md:w-64]="isOpen"
      [class.md:w-0]="!isOpen"
      [class.md:translate-x-0]="true"
      class="fixed inset-y-0 left-0 z-40 bg-[#3A4750] border-r border-white/5 flex flex-col h-full transform transition-all duration-300 ease-in-out md:relative shadow-2xl md:shadow-none overflow-hidden"
    >
      <div class="p-6 flex items-center justify-between gap-3 min-w-[16rem]">
        <div class="flex items-center gap-3">
           <!-- Replaced div placeholder with logo image -->
           <img src="/Main-logo.png" alt="Logo" class="w-8 h-8 object-contain drop-shadow-md">
           <span class="text-xl font-bold tracking-wider text-white">DASHBOARD</span>
        </div>
        <!-- Close button for mobile -->
        <button (click)="closeSidebar.emit()" class="md:hidden text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <nav class="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <a routerLink="/dashboard" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-400 hover:bg-white/5 hover:text-white border border-transparent animate-sidebar-item">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <span class="font-medium">Users</span>
        </a>
        <a routerLink="/ticket-list" routerLinkActive="active-link" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-400 hover:bg-white/5 hover:text-white border border-transparent animate-sidebar-item">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
          <span class="font-medium">List Ticket</span>
        </a>
        <a routerLink="/equipments" routerLinkActive="active-link" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-400 hover:bg-white/5 hover:text-white border border-transparent animate-sidebar-item">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <span class="font-medium">Equipments</span>
        </a>
        <a routerLink="/roles" routerLinkActive="active-link" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-400 hover:bg-white/5 hover:text-white border border-transparent animate-sidebar-item">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <span class="font-medium">Roles</span>
        </a>
      </nav>

      <div class="p-4 border-t border-white/5 animate-sidebar-footer">
        <div class="p-4 rounded-xl bg-[#303841] border border-white/5">
          <p class="text-xs text-gray-400 mb-1">Logged in as</p>
          <p class="text-sm font-bold text-white truncate">{{ currentUser?.name || 'User' }}</p>
          <button (click)="logout()" class="mt-2 text-xs text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1 animate-hover-pulse">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .active-link {
      background-color: rgba(215, 35, 35, 0.1) !important;
      color: var(--color-primary) !important;
      border-color: rgba(215, 35, 35, 0.2) !important;
    }

    .animate-sidebar-item {
      transition: all 0.3s ease;
    }

    .animate-sidebar-item:hover {
      transform: translateX(5px);
      background-color: rgba(255, 255, 255, 0.1) !important;
    }

    .animate-sidebar-footer {
      animation: fadeInUp 0.6s ease-out;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-hover-pulse {
      transition: all 0.3s ease;
    }

    .animate-hover-pulse:hover {
      transform: translateY(-2px) scale(1.05);
    }
  `]
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  authService = inject(AuthService);
  currentUser: any = null;

  constructor() {
    // Load current user and update it when component initializes
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUser = this.authService.getCurrentUser();
    }
  }

  logout() {
    this.authService.logout();
    // Update current user after logout
    this.loadCurrentUser();
  }

  // Removed onLinkClick to strictly prevent auto-closing
  // The sidebar will now ONLY close via:
  // 1. Burger menu (toggle)
  // 2. Close button (mobile)
  // 3. Overlay click (mobile)
}