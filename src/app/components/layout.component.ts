import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex min-h-screen bg-[#303841] overflow-hidden relative">
      
      <!-- Sidebar with responsive state -->
      <app-sidebar [isOpen]="isSidebarOpen" (closeSidebar)="isSidebarOpen = false"></app-sidebar>
      
      <main class="flex-1 overflow-auto flex flex-col relative h-screen w-full">
        <!-- Header emits toggleSidebar event -->
        <app-header (toggleSidebar)="isSidebarOpen = !isSidebarOpen"></app-header>
        <router-outlet></router-outlet>
      </main>

      <!-- Overlay for mobile sidebar -->
      <div *ngIf="isSidebarOpen" (click)="isSidebarOpen = false" class="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"></div>
    </div>
  `
})
export class LayoutComponent {
  // Default to open on desktop (check safely)
  isSidebarOpen = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
}
