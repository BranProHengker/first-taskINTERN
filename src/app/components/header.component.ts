import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#303841]/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
      <div class="flex items-center gap-3">
        <a [routerLink]="['/dashboard']" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-lg hover:bg-white/10 transition cursor-pointer text-gray-400 hover:text-white" title="Back to Dashboard">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </a>
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">Welcome, {{ currentUser?.name || 'User' }}</h1>
          <p class="text-xs text-gray-500 font-medium">Have a nice day!</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="relative">
          <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#303841]"></span>
          <button class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
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
export class HeaderComponent {
  authService = inject(AuthService);
  currentUser = this.authService.getCurrentUser();

  get initials(): string {
    return this.currentUser?.name?.substring(0, 2).toUpperCase() || 'GU';
  }
}