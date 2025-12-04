import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
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
    roleId: 2, // Default User
    roleName: 'User'
  };
  isEditMode = false;
  isLoading = false;
  errorMsg = '';

  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadUser(Number(id));
    }
  }

  loadUser(id: number) {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (found) => {
        if (found) {
          this.user = { ...found };
          // Clear password for edit mode security
          this.user.password = ''; 
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

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';

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
