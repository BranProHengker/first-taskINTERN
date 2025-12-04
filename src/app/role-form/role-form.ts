import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css'
})
export class RoleFormComponent implements OnInit {
  role: any = {
    roleName: '',
    roleAccess: []
  };
  isEditMode = false;
  isLoading = false;
  errorMsg = '';
  
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadRole(Number(id));
    }
  }

  loadRole(id: number) {
    this.isLoading = true;
    this.requestService.getRoleById(id).subscribe({
      next: (data) => {
        this.role = data;
        // Ensure roleAccess is initialized
        if (!this.role.roleAccess) {
          this.role.roleAccess = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load role', err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load role details.';
      }
    });
  }

  addAccess() {
    // Basic structure based on user input
    this.role.roleAccess.push({
      menuId: 0,
      akses: 0,
      roleId: this.role.id || 0 // Will be 0 for new role, handled by backend
    });
  }

  removeAccess(index: number) {
    this.role.roleAccess.splice(index, 1);
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';

    if (!this.role.roleName) {
      this.errorMsg = 'Role Name is required';
      this.isLoading = false;
      return;
    }

    // Prepare payload matching the provided JSON structure
    const payload = {
      ...this.role,
      roleAccess: this.role.roleAccess.map((access: any) => ({
        id: access.id || 0, // Default to 0 for new entries
        roleId: this.role.id || 0,
        menuId: Number(access.menuId),
        akses: Number(access.akses)
      }))
    };

    if (this.isEditMode) {
      this.requestService.updateRole(payload).subscribe({
        next: () => {
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Failed to update role', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to update role.';
        }
      });
    } else {
      this.requestService.createRole(payload).subscribe({
        next: () => {
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Failed to create role', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to create role.';
        }
      });
    }
  }
}
