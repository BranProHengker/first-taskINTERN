import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { RequestService } from '../services/request.service';
import { User } from '../models/user.model';
import { ChangeDetectorRef } from '@angular/core';
import { passwordValidator } from '../validators/password.validator';

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
  showPassword = false;

  private userService = inject(UserService);
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  validatePasswordRealTime() {
    if (!this.isEditMode && this.user.password) {
      // Use the custom password validator
      const passwordValidation = passwordValidator()({ value: this.user.password } as any);
      if (passwordValidation) {
        if (passwordValidation['minLength']) {
          this.fieldErrors.password = `Password must be at least ${passwordValidation['minLength'].requiredLength} characters long. (Current: ${passwordValidation['minLength'].actualLength})`;
        } else if (passwordValidation['noUpperCase']) {
          this.fieldErrors.password = 'Password must contain at least one uppercase letter.';
        } else if (passwordValidation['noLowerCase']) {
          this.fieldErrors.password = 'Password must contain at least one lowercase letter.';
        } else if (passwordValidation['noNumber']) {
          this.fieldErrors.password = 'Password must contain at least one number.';
        } else if (passwordValidation['noSpecialChar']) {
          this.fieldErrors.password = 'Password must contain at least one special character.';
        }
      } else {
        // If there are no validation errors, clear the password error
        delete this.fieldErrors.password;
      }
    } else if (!this.user.password) {
      // If password is empty and not in edit mode, show required error
      if (!this.isEditMode) {
        this.fieldErrors.password = 'Password is required';
      }
    }
  }

  ngOnInit() {
    console.log('UserForm: Initializing form...');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      // Load roles and user together, but ensure roles are loaded first
      this.loadRolesAndUser(Number(id));
    } else {
      // Just load roles for new user creation
      this.loadRoles();
      // Initialize real-time password validation for new user forms
      this.validatePasswordRealTime();
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

        // Trigger change detection after roles are loaded
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.errorMsg = 'Failed to load roles.';
        // Trigger change detection after error
        this.cdr.detectChanges();
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
    console.log('UserForm: Loading user data for id:', id);
    this.isLoading = true;
    // Ensure change detection runs before showing loading state
    this.cdr.detectChanges();

    this.userService.getUserById(id).subscribe({
      next: (found) => {
        console.log('UserForm: User data received:', found);
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
        console.log('UserForm: Data loaded, user:', this.user.fullName);
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('UserForm: Failed to load user details', err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load user details.';
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
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
      // Run validation one more time before submission to ensure fieldErrors is accurate
      this.validatePasswordRealTime();
    }

    if (!this.user.roleId || this.user.roleId <= 0) {
      this.fieldErrors.roleId = 'Role is required.';
    }

    // Cek apakah ada error field
    const hasFieldErrors = Object.values(this.fieldErrors).some(error => error);
    if (hasFieldErrors) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const request = this.isEditMode
      ? this.userService.updateUser({ ...this.user, id: this.user.id! })
      : this.userService.createUser(this.user);

    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.errorMsg = `Failed to ${this.isEditMode ? 'update' : 'create'} user.`;
        this.cdr.detectChanges();
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
