import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  user = {
    fullName: '',
    emailAddress: '',
    companyName: '',
    telp: '',
    password: ''
  };
  errorMsg = '';
  isLoading = false;
  showPassword = false;

  constructor(private router: Router, private authService: AuthService) {}

  onRegister() {
    this.isLoading = true;
    this.errorMsg = '';
    
    this.authService.register(this.user).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Assuming success 200 OK means registered
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.errorMsg = 'Registration failed. Please try again later.';
      }
    });
  }
}
