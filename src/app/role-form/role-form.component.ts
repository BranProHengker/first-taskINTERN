import { Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoleService } from '../services/role.service';
import { ChangeDetectorRef } from '@angular/core';
import { first } from 'rxjs/operators';

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
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

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

    // Add timeout protection to prevent indefinite loading state
    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.error('RoleForm: Load role timed out after 10 seconds');
        this.isLoading = false;
        this.errorMsg = 'Failed to load role details due to timeout.';
        this.cdr.detectChanges();
      }
    }, 10000);

    this.roleService.getRoleById(id).pipe(
      first()
    ).subscribe({
      next: (data) => {
        // Clear timeout if successful
        clearTimeout(timeoutId);

        // Ensure we update in the Angular zone
        this.ngZone.run(() => {
          this.role = data;
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        // Clear timeout if error
        clearTimeout(timeoutId);

        console.error('RoleForm: Failed to load role', err);
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMsg = 'Failed to load role details.' + (err?.message ? ` ${err.message}` : '');
          this.cdr.detectChanges();
        });
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

    // Prepare the payload based on the operation
    let payload: any;

    if (this.isEditMode) {
      // For edit, ensure we're sending the complete role data
      payload = {
        ...this.role,
        roleAccess: this.role.roleAccess || []  // Ensure roleAccess is always an array
      };

      this.roleService.updateRole(payload).pipe(
        first()
      ).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
            this.router.navigate(['/roles']);
          });
        },
        error: (err) => {
          console.error('Failed to update role', err);
          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMsg = 'Failed to update role.';
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      // For create, make sure we only send the necessary fields
      payload = {
        roleName: this.role.roleName,
        roleAccess: []  // Initialize as empty array for new roles
      };

      this.roleService.createRole(payload).pipe(
        first()
      ).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
            this.router.navigate(['/roles']);
          });
        },
        error: (err) => {
          console.error('Failed to create role', err);
          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMsg = 'Failed to create role. ' + (err?.error?.message || err?.message || '');
            this.cdr.detectChanges();
          });
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
