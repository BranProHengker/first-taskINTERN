import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RoleService } from '../services/role.service';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { DataRefreshService } from '../services/data-refresh.service';
import { Subscription } from 'rxjs';

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
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private dataRefreshService = inject(DataRefreshService);
  private refreshSubscription: Subscription | undefined;

  ngOnInit() {
    this.loadRoles();

    // Subscribe to refresh events from other components
    this.refreshSubscription = this.dataRefreshService.refresh$.subscribe(shouldRefresh => {
      if (shouldRefresh) {
        // Load roles when refresh is triggered
        this.loadRoles();
        // Reset the refresh flag after loading
        setTimeout(() => {
          this.dataRefreshService.resetRefreshFlag();
        }, 100); // Small delay to ensure loading is complete
      }
    });
  }

  loadRoles() {
    console.log('RoleList: Starting to load roles...');
    this.isLoading = true;
    this.errorMsg = '';
    // Ensure change detection runs before showing loading state
    this.cdr.detectChanges();

    this.roleService.getRoles().subscribe({
      next: (data) => {
        console.log('RoleList: Received role data:', data);
        this.roles = Array.isArray(data) ? data : (data as any).content || [];
        this.isLoading = false;
        console.log('RoleList: Data loaded, roles:', this.roles.length);
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('RoleList: Failed to load roles', err);
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
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      }
    });
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(id).subscribe({
        next: () => {
          // Load the roles again after successful deletion
          this.loadRoles();
          // Also trigger refresh to notify other components
          this.dataRefreshService.triggerRefresh();
          // Clear any previous error messages
          this.errorMsg = '';
        },
        error: (err) => {
          console.error('Failed to delete role', err);
          // Check if the error message indicates that the role is in use
          if (err.error && typeof err.error === 'string' &&
              (err.error.includes('Check if role is in use') ||
               err.error.includes('has dependencies') ||
               err.error.includes('Role masih dipakai oleh user'))) {
            this.errorMsg = 'Role still in use by a user';
          } else {
            this.errorMsg = 'Failed to delete role. Please try again.';
          }
          // Trigger change detection in case of error too
          this.cdr.detectChanges();
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
}
