import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex min-h-screen bg-[#303841] overflow-hidden">
      <app-sidebar></app-sidebar>
      <main class="flex-1 overflow-auto flex flex-col relative h-screen">
        <app-header></app-header>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LayoutComponent {}
