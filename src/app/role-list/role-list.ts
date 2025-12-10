import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';
import { ChangeDetectorRef } from '@angular/core';

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
  private requestService = inject(RequestService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    console.log('RoleList: Starting to load roles...');
    this.isLoading = true;
    // Ensure change detection runs before showing loading state
    this.cdr.detectChanges();

    this.requestService.getRoles().subscribe({
      next: (data) => {
        console.log('RoleList: Received role data:', data);
        this.roles = Array.isArray(data) ? data : (data as any).content || [];
        this.isLoading = false;
        console.log('RoleList: Data loaded, roles:', this.roles.length);
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status !== 401) {
          console.error('RoleList: Failed to load roles', err);
        } else {
          console.warn('RoleList: Load roles failed due to authentication error');
        }
        this.isLoading = false;
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
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
          // Tambahkan alert khusus jika role tidak bisa dihapus karena masih digunakan
          if (err && err.error && typeof err.error === 'string' &&
              err.error.includes('Role masih dipakai oleh user')) {
            alert('Role masih dipakai oleh user');
          }
          // Trigger change detection to ensure UI updates in case of error
          this.cdr.detectChanges();
        }
      });
    }
  }
}