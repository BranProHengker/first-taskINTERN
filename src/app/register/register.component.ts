import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMsg = '';
  isLoading = false;
  showPassword = false;
  submitted = false;  // Track form submission

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      emailAddress: ['', [Validators.required, Validators.email]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      telp: ['', [Validators.pattern(/^[\+]?[0-9\s\-\(\)]+$/)]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  get fullName() { return this.registerForm.get('fullName'); }
  get emailAddress() { return this.registerForm.get('emailAddress'); }
  get companyName() { return this.registerForm.get('companyName'); }
  get telp() { return this.registerForm.get('telp'); }
  get password() { return this.registerForm.get('password'); }

  onRegister() {
    this.submitted = true;  // Mark form as submitted to show validation errors

    // Mark all fields as touched to ensure validation messages show immediately
    this.registerForm.markAllAsTouched();

    // Check form validity immediately and return if invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    const userData = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Assuming success 200 OK means registered
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);

        // Handle specific error messages from the server
        if (err.status === 400) {
          // Extract detailed validation errors from server response
          if (err.error && typeof err.error === 'object') {
            if (err.error.message) {
              this.errorMsg = err.error.message;
            } else if (err.error.errors) {
              // If server returns detailed validation errors
              const errors = Object.keys(err.error.errors).map(key =>
                `${key}: ${err.error.errors[key]}`
              );
              this.errorMsg = errors.join(', ');
            } else {
              this.errorMsg = 'Registration failed. Please check your input.';
            }
          } else {
            this.errorMsg = 'Registration failed. Please check your input.';
          }
        } else if (err.status === 409) {
          this.errorMsg = 'Email address already exists. Please use a different email.';
        } else if (err.status === 0) {
          this.errorMsg = 'Network error. Please check your connection.';
        } else {
          this.errorMsg = err.error?.message || 'Registration failed. Please try again later.';
        }
      }
    });
  }
}
