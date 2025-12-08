import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = true;
  selectedRole: string = '';
  availableRoles: string[] = [];
  searchTerm: string = '';
  isRoleDropdownOpen: boolean = false;

  constructor(private userService: UserService, private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    const term = target.value.toLowerCase();

    // Apply all filters
    this.applyFilters(term);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  onRoleFilterChange(role: string) {
    this.selectedRole = role;
    this.applyFilters(); // Apply all filters including the role filter
  }

  applyFilters(searchTerm: string = '') {
    let filtered = [...this.users]; // Start with all users

    // Apply role filter if a role is selected
    if (this.selectedRole) {
      filtered = filtered.filter(user => user.roleName && user.roleName === this.selectedRole);
    }

    // Apply search filter if a search term is provided
    if (searchTerm) {
      filtered = filtered.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
        (user.emailAddress && user.emailAddress.toLowerCase().includes(searchTerm)) ||
        (user.companyName && user.companyName.toLowerCase().includes(searchTerm)) ||
        (user.roleName && user.roleName.toLowerCase().includes(searchTerm))
      );
    }

    this.filteredUsers = filtered;
  }

  toggleRoleDropdown() {
    this.isRoleDropdownOpen = !this.isRoleDropdownOpen;
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data: any) => {
        // Handle possible response wrapper or direct array
        let userData: User[] = [];

        if (Array.isArray(data)) {
          userData = data;
        } else if (data && Array.isArray(data.content)) {
          userData = data.content;
        } else if (data && typeof data === 'object') {
          // Check for common wrapper properties
          if (data.data && Array.isArray(data.data)) {
            userData = data.data;
          } else if (data.content && Array.isArray(data.content)) {
            userData = data.content;
          } else if (data.users && Array.isArray(data.users)) {
            userData = data.users;
          } else if (data.result && Array.isArray(data.result)) {
            userData = data.result;
          } else {
            // Try to find any array property in the object
            const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrayProps.length > 0) {
              const firstArrayProp = arrayProps[0];
              userData = data[firstArrayProp];
            } else {
              userData = [];
            }
          }
        } else {
          userData = [];
        }

        // Filter valid users and extract unique roles
        this.users = userData.filter(user => user && user.id !== undefined);

        // Extract unique roles from users, filtering out null/undefined/empty values
        const allRoles = this.users.map(user => user.roleName).filter(role => role && role.trim() !== '');
        this.availableRoles = [...new Set(allRoles)];

        // Apply all filters
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.users = [];
        this.filteredUsers = [];
        this.availableRoles = [];
      }
    });
  }

  getRoleColor(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'developer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'user': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          // Check if the deleted user is the current user
          const currentUser = this.authService.getCurrentUser();
          if (currentUser && currentUser.userId === id) {
            // If admin deletes the current logged-in user, log them out automatically
            alert('The account has been deleted. You will be logged out automatically.');
            this.authService.logout();
          } else {
            this.loadUsers(); // Reload list for other users
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.role-dropdown')) {
      this.isRoleDropdownOpen = false;
    }
  }
}
