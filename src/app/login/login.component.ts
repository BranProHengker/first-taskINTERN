import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMsg = '';
  isLoading = false;
  showPassword = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    this.isLoading = true;
    this.errorMsg = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log('[Login] Login success:', response);
        
        // Simpan token dengan key yang sesuai
        if (response?.token) {
          localStorage.setItem('auth_token', response.token);
          console.log('[Login] Token saved as auth_token');
        }
        
        // Simpan user info juga
        if (response?.user) {
          localStorage.setItem('auth_user', JSON.stringify(response.user));
        }
        
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        console.error('[Login] Error:', err);
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
