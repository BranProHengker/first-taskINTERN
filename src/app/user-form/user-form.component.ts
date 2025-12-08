import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { RequestService } from '../services/request.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  user: Partial<User> = {
    fullName: '',
    emailAddress: '',
    password: '',
    companyName: '',
    telp: '',
    roleId: undefined, // Will be set when roles are loaded
    roleName: undefined // Will be set based on selected role
  };
  isEditMode = false;
  isLoading = false;
  errorMsg = '';
  roles: any[] = []; // Store the roles fetched from the backend
  // Error messages per field
  fieldErrors: {
    fullName?: string;
    emailAddress?: string;
    companyName?: string;
    telp?: string;
    password?: string;
    roleId?: string;
  } = {};
  isRoleDropdownOpen = false;
  selectedRoleName: string | null = null;

  private userService = inject(UserService);
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      // Load roles and user together, but ensure roles are loaded first
      this.loadRolesAndUser(Number(id));
    } else {
      // Just load roles for new user creation
      this.loadRoles();
    }
  }

  loadRoles() {
    this.requestService.getRoles().subscribe({
      next: (data) => {
        this.roles = Array.isArray(data) ? data : (data as any).content || [];
        // Don't set a default role - require explicit user selection for new users
        if (!this.isEditMode) {
          this.user.roleId = undefined;
          this.user.roleName = undefined;
          this.selectedRoleName = null;
        } else if (this.roles.length > 0 && this.user.roleId) {
          // For edit mode, update the role name based on selected roleId
          this.updateUserRoleFromRoles(this.user as User);
        }
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.errorMsg = 'Failed to load roles.';
      }
    });
  }

  loadRolesAndUser(userId: number) {
    // Load roles first, then load user details
    this.requestService.getRoles().subscribe({
      next: (data) => {
        this.roles = Array.isArray(data) ? data : (data as any).content || [];
        // Now load the user with roles available
        this.loadUser(userId);
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.errorMsg = 'Failed to load roles.';
        // Still try to load the user even if roles failed
        this.loadUser(userId);
      }
    });
  }

  loadUser(id: number) {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (found) => {
        if (found) {
          this.user = { ...found };
          // Clear password for edit mode security
          this.user.password = '';

          // If roles are already loaded, update the roleId/roleName
          if (this.roles.length > 0) {
            this.updateUserRoleFromRoles(found);
          } else {
            // Set the selected role name after roles are loaded (in the roles loading callback)
            this.selectedRoleName = found.roleName || '';
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load user details.';
      }
    });
  }

  updateUserRoleFromRoles(found: User) {
    const matchedRole = this.roles.find(role => role.roleName === found.roleName || role.id === found.roleId);
    if (matchedRole) {
      this.user.roleId = matchedRole.id;
      this.user.roleName = matchedRole.roleName;
      this.selectedRoleName = matchedRole.roleName;
    } else {
      // Jika tidak ditemukan role yang cocok, gunakan nama dari user
      this.selectedRoleName = found.roleName || '';
    }
  }

  updateRoleName(roleId: number) {
    const selectedRole = this.roles.find(role => role.id === roleId);
    if (selectedRole) {
      this.user.roleName = selectedRole.roleName;
      this.selectedRoleName = selectedRole.roleName;
    }
  }

  selectRole(roleId: number, roleName: string) {
    this.user.roleId = roleId;
    this.user.roleName = roleName;
    this.selectedRoleName = roleName;
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';
    // Reset field errors
    this.fieldErrors = {};

    // Validasi field-field wajib dan set error per field
    if (!this.user.fullName?.trim()) {
      this.fieldErrors.fullName = 'Full Name is required';
    }

    if (!this.user.emailAddress?.trim()) {
      this.fieldErrors.emailAddress = 'Email Address is required';
    } else {
      // Validasi format email sederhana
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.user.emailAddress)) {
        this.fieldErrors.emailAddress = 'Please enter a valid email address';
      }
    }

    if (!this.user.companyName?.trim()) {
      this.fieldErrors.companyName = 'Company Name is required';
    }

    if (!this.user.telp?.trim()) {
      this.fieldErrors.telp = 'Phone is required';
    }

    // Validasi password jika dalam mode create
    if (!this.isEditMode) {
      if (!this.user.password?.trim()) {
        this.fieldErrors.password = 'Password is required';
      } else if (this.user.password && this.user.password.length < 5) {
        this.fieldErrors.password = 'Password must be at least 5 characters long';
      }
    }

    if (!this.user.roleId || this.user.roleId <= 0) {
      this.fieldErrors.roleId = 'Role is required.';
    }

    // Cek apakah ada error field
    const hasFieldErrors = Object.values(this.fieldErrors).some(error => error);
    if (hasFieldErrors) {
      this.isLoading = false;
      return;
    }

    const request = this.isEditMode
      ? this.userService.updateUser(this.user)
      : this.userService.createUser(this.user);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.errorMsg = `Failed to ${this.isEditMode ? 'update' : 'create'} user.`;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.role-dropdown')) {
      this.isRoleDropdownOpen = false;
    }
  }
}
