import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RegisterComponent } from './register/register.component';
import { TicketListComponent } from './ticket-list/ticket-list.component';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { LayoutComponent } from './components/layout.component';
import { authGuard } from './auth.guard';
import { UserFormComponent } from './user-form/user-form.component';
import { TicketFormComponent } from './ticket-form/ticket-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: '', 
    component: LayoutComponent, 
    // canActivate: [authGuard], // Disabled for looser security as requested
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users/new', component: UserFormComponent },
      { path: 'users/:id/edit', component: UserFormComponent },
      { path: 'ticket-list', component: TicketListComponent },
      { path: 'tickets/new', component: TicketFormComponent },
      { path: 'tickets/:id', component: TicketDetailComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
