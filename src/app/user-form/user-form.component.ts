import { Component, inject, OnInit } from '@angular/core';
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
        // Set a default role for new user creation if user is not in edit mode
        if (!this.isEditMode && this.roles.length > 0) {
          // Set default role (first role in the list as an example, or find 'User' role)
          const defaultRole = this.roles.find(role => role.roleName === 'User') || this.roles[0];
          if (defaultRole) {
            this.user.roleId = defaultRole.id;
            this.user.roleName = defaultRole.roleName;
          }
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
    }
  }

  updateRoleName(roleId: number) {
    const selectedRole = this.roles.find(role => role.id === roleId);
    if (selectedRole) {
      this.user.roleName = selectedRole.roleName;
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';

    // Make sure we have a roleId selected
    if (this.user.roleId === undefined || this.user.roleId === null) {
      this.errorMsg = 'Please select a role.';
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
}
