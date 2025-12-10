import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css'
})
export class RoleFormComponent implements OnInit {
  role: any = {
    roleName: ''
  };
  isEditMode = false;
  isLoading = false;
  errorMsg = '';

  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    console.log('RoleForm: Initializing form...');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadRole(Number(id));
    }
  }

  loadRole(id: number) {
    console.log('RoleForm: Loading role data for id:', id);
    this.isLoading = true;
    // Ensure change detection runs before showing loading state
    this.cdr.detectChanges();

    this.requestService.getRoleById(id).subscribe({
      next: (data) => {
        console.log('RoleForm: Role data received:', data);
        // Temporarily disable the form during data update to ensure proper binding
        this.isLoading = true; // Keep loading state briefly

        // Create a completely new object to force change detection
        const newRole = { roleName: data.roleName };

        // Update the role object with the new data
        this.role = { ...newRole };

        this.isLoading = false;
        console.log('RoleForm: Data loaded, role:', this.role.roleName);

        // Multiple change detection calls to ensure proper propagation
        this.cdr.detectChanges();

        // Force an additional tick to ensure Angular processes the changes
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);

        // And one more timeout to ensure ngModel has time to update
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 10);
      },
      error: (err) => {
        console.error('RoleForm: Failed to load role', err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load role details.';
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';

    if (!this.role.roleName) {
      this.errorMsg = 'Role Name is required';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    if (this.isEditMode) {
      this.requestService.updateRole(this.role).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Failed to update role', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to update role.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.requestService.createRole(this.role).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Failed to create role', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to create role.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // addAccess() {
  //   if (!this.role.roleAccess) {
  //     this.role.roleAccess = [];
  //   }
  //   this.role.roleAccess.push({ menuId: null, akses: null });
  // }

  // removeAccess(index: number) {
  //   if (this.role.roleAccess) {
  //     this.role.roleAccess.splice(index, 1);
  //   }
  // }
}