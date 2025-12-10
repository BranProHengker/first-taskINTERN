import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css'
})
export class RoleListComponent implements OnInit {
  roles: any[] = [];
  isLoading = true;
  errorMsg: string = '';
  private requestService = inject(RequestService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoading = true;
    this.errorMsg = '';
    this.requestService.getRoles().subscribe({
      next: (data) => {
        this.roles = Array.isArray(data) ? data : (data as any).content || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.isLoading = false;

        // Handle 401 Unauthorized error
        if (err.status === 401) {
          // Check if user is already logged in by checking token
          if (this.authService.isLoggedIn()) {
            // If we have a token but still get 401, the token might be expired
            // Logout to clear the invalid token
            this.authService.logout();
          } else {
            // User is not logged in, show auth required message
            this.errorMsg = 'Authentication required. Please login to view roles.';
          }
        } else {
          this.errorMsg = 'Failed to load roles. Please try again.';
        }
      }
    });
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.requestService.deleteRole(id).subscribe({
        next: () => {
          this.loadRoles();
        },
        error: (err) => {
          console.error('Failed to delete role', err);
          // Check if the error message indicates that the role is in use
          if (err.error && typeof err.error === 'string' &&
              (err.error.includes('Check if role is in use') ||
               err.error.includes('has dependencies') ||
               err.error.includes('Role masih dipakai oleh user'))) {
            this.errorMsg = 'Role masih dipakai oleh user';
          } else {
            this.errorMsg = 'Failed to delete role. Please try again.';
          }
        }
      });
    }
  }
}
