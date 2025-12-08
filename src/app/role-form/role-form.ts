import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoleService } from '../services/role.service';

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
  
  private roleService = inject(RoleService);
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
    this.roleService.getRoleById(id).subscribe({
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

    const payload = {
      ...this.role,
      roleAccess: this.role.roleAccess.map((access: any) => ({
        id: access.id || 0,
        roleId: this.role.id || 0,
        menuId: Number(access.menuId),
        akses: Number(access.akses)
      }))
    };

    const successHandler = {
      next: () => {
        this.router.navigate(['/roles']);
      },
      error: (err: any) => {
        console.error('Create/Update error:', err);
        this.isLoading = false;
        this.errorMsg = 'Failed to save role. ' + (err.message || '');
      }
    };

    if (this.isEditMode) {
      this.roleService.updateRole(payload).subscribe(successHandler);
    } else {
      this.roleService.createRole(payload).subscribe(successHandler);
    }
  }
}