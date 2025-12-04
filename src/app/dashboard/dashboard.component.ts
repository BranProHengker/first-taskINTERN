import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = true;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data: any) => {
        // Handle possible response wrapper or direct array
        if (Array.isArray(data)) {
             this.users = data;
        } else if (data && Array.isArray(data.content)) {
             this.users = data.content; 
        } else if (data && typeof data === 'object') {
             // Sometimes API might return a single object or different structure
             // Try to find any array property
             const possibleArray = Object.values(data).find(val => Array.isArray(val));
             this.users = (possibleArray as User[]) || [];
        } else {
             this.users = [];
        }
        this.filteredUsers = this.users;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        // Removed fallback mock data to show actual API state
        this.users = [];
        this.filteredUsers = [];
      }
    });
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    const term = target.value.toLowerCase();
    
    if (!term) {
      this.filteredUsers = this.users;
      return;
    }

    this.filteredUsers = this.users.filter(user => 
      (user.fullName && user.fullName.toLowerCase().includes(term)) ||
      (user.emailAddress && user.emailAddress.toLowerCase().includes(term)) ||
      (user.companyName && user.companyName.toLowerCase().includes(term)) ||
      (user.roleName && user.roleName.toLowerCase().includes(term))
    );
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
          this.loadUsers(); // Reload list
        },
        error: (err) => console.error(err)
      });
    }
  }
}
