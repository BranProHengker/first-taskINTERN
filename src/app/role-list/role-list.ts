import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RoleService } from '../services/role.service';
import { HttpErrorResponse } from '@angular/common/http';

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
  private roleService = inject(RoleService);

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoading = true;
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.isLoading = false;
      }
    });
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      console.log('[RoleList] Attempting to delete role with id:', id);
      this.roleService.deleteRole(id).subscribe({
        next: () => {
          console.log('Role deleted successfully');
          this.loadRoles();
        },
        error: (err: any) => {
          console.error('Delete error:', err);
          console.error('Error status:', err.status);
          console.error('Error body:', err.error);
          
          // Log detail error
          if (err.status === 400) {
            alert('Bad Request - Backend rejected delete. Check if role is in use or has dependencies.');
          } else if (err.status === 401) {
            alert('Unauthorized - Please login again');
          } else if (err.status === 403) {
            alert('Forbidden - You do not have permission to delete');
          } else {
            alert('Failed to delete role: ' + (err.message || 'Unknown error'));
          }
        }
      });
    }
  }
}
