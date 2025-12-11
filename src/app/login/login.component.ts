import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMsg = '';
  isLoading = false;
  showPassword = false;
  submitted = false;  // Track form submission

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onLogin() {
    this.submitted = true;  // Mark form as submitted to show validation errors

    // Mark all fields as touched to ensure validation messages show immediately
    this.loginForm.markAllAsTouched();

    // Check form validity immediately and return if invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        console.log('[Login] Login success:', response);

        // Simpan token dengan key yang sesuai
        if (isPlatformBrowser(this.platformId) && response?.token) {
          localStorage.setItem('auth_token', response.token);
          console.log('[Login] Token saved as auth_token');
        } else if (isPlatformBrowser(this.platformId) && response?.accessToken) {
          localStorage.setItem('auth_token', response.accessToken);
          console.log('[Login] Token saved as auth_token from accessToken');
        }

        // Simpan user info juga
        if (isPlatformBrowser(this.platformId) && response) {
          // Simpan seluruh response karena beberapa field mungkin penting
          localStorage.setItem('auth_user', JSON.stringify(response));
        }

        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        console.error('[Login] Error:', err);
        this.isLoading = false;

        // Handle specific error messages from the server
        if (err.status === 401) {
          this.errorMsg = 'Invalid email or password. Please try again.';
        } else if (err.status === 400) {
          this.errorMsg = err.error?.message || 'Invalid request. Please check your input.';
        } else if (err.status === 0) {
          this.errorMsg = 'Network error. Please check your connection.';
        } else {
          this.errorMsg = err.error?.message || 'Login failed. Please check your credentials.';
        }
      }
    });
  }
}
