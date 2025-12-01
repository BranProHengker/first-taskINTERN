import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  isLoading = true;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (data: any) => {
        // Swagger says it returns Notification[], but logical requirement is Users.
        // If data is wrapped or different, we might need to map it.
        // Assuming direct array for now or checking if it has a content property.
        if (Array.isArray(data)) {
             this.users = data;
        } else if (data.content && Array.isArray(data.content)) {
             this.users = data.content; // Handle wrapper if any
        } else {
             this.users = []; // fallback
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        // Mock data fallback for demo if API is unreachable
        this.users = [
           { id: 1, emailAddress: 'alex@animejs.com', fullName: 'Alex T.', companyName: 'AnimeJS', telp: '08123456789', roleId: 1, roleName: 'Admin' },
           { id: 2, emailAddress: 'sarah@design.io', fullName: 'Sarah C.', companyName: 'Creative Co', telp: '08987654321', roleId: 2, roleName: 'User' },
           { id: 3, emailAddress: 'mike@dev.net', fullName: 'Mike R.', companyName: 'Dev Corp', telp: '081122334455', roleId: 2, roleName: 'Developer' },
        ];
      }
    });
  }
}
