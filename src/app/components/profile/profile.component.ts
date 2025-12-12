import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  userService = inject(UserService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef);
  router = inject(Router);

  currentUser = this.authService.getCurrentUser();
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showOldPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;

  changePasswordForm: FormGroup;

  constructor() {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        this.passwordValidator
      ]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Add validation to ensure new password is not the same as old password
    this.changePasswordForm.get('newPassword')?.setValidators([
      Validators.required,
      Validators.minLength(6),
      this.passwordValidator,
      this.sameAsOldPasswordValidator.bind(this)
    ]);
  }

  sameAsOldPasswordValidator(control: any) {
    const oldPassword = this.changePasswordForm?.get('oldPassword')?.value;
    const newPassword = control.value;

    if (oldPassword && newPassword && oldPassword === newPassword) {
      return { sameAsOldPassword: true };
    }

    return null; // Valid if not the same
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;

    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
      return { passwordMismatch: true };
    }

    return null; // Valid if matching
  }


  onChangePasswordSubmit() {
    if (this.changePasswordForm.valid) {
      this.isSubmitting = true;
      this.message = '';

      const { oldPassword, newPassword } = this.changePasswordForm.value;

      this.userService.changePassword(oldPassword, newPassword).subscribe({
        next: (response) => {
          // Use setTimeout to defer the state update and avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.isSubmitting = false;
            this.message = 'Password changed successfully!';
            this.messageType = 'success';
            this.changePasswordForm.reset();
            this.cdr.detectChanges(); // Manually trigger change detection

            // Redirect to dashboard after successful password change
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1000); // Delay redirect by 1 second to show success message
          });
        },
        error: (error) => {
          // Use setTimeout to defer the state update and avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.isSubmitting = false;

            // Determine the appropriate error message based on response
            let errorMessage = 'Failed to change password. Please try again.';

            // Handle different types of error responses
            if (error.status === 0) {
              // Network error or CORS issue
              errorMessage = 'Network error. Please check your connection.';
            } else if (error.status === 400) {
              // Specific error for same password
              if (typeof error.error === 'object' && error.error?.message?.includes('same as old password')) {
                errorMessage = 'New password cannot be the same as the old password';
              } else if (typeof error.error === 'string' && error.error.includes('same as old password')) {
                errorMessage = 'New password cannot be the same as the old password';
              } else if (typeof error.error === 'object' && error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.error && typeof error.error === 'string') {
                errorMessage = error.error;
              } else {
                errorMessage = 'Bad request. Please check your input.';
              }
            } else if (error.status === 401) {
              // Unauthorized error
              errorMessage = 'Session expired. Please log in again.';
            } else if (typeof error === 'object' && error.message && error.message.includes('JSON.parse')) {
              // JSON parsing error - this usually means the password was changed successfully
              // but the response wasn't properly formatted as JSON
              errorMessage = 'Password changed successfully!';
              // Redirect to dashboard even if there's a JSON parsing issue
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1000);
              this.messageType = 'success';
              this.cdr.detectChanges(); // Manually trigger change detection
              return; // Exit early after redirect
            } else if (typeof error.error === 'object' && error.error?.message) {
              // Standard API error response
              errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              // String error response
              errorMessage = error.error;
            } else if (typeof error === 'string') {
              // General error
              errorMessage = error;
            } else if (error.message) {
              // Error object with message property
              errorMessage = error.message;
            } else {
              // General error fallback
              errorMessage = 'An unexpected error occurred.';
            }

            this.message = errorMessage;
            // If it's a JSON parsing error, we still want to show success message
            if (!(typeof error === 'object' && error.message && error.message.includes('JSON.parse'))) {
              this.messageType = 'error';
            }
            this.cdr.detectChanges(); // Manually trigger change detection
          });
        }
      });
    }
  }

  toggleShowOldPassword() {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleShowNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleShowConfirmNewPassword() {
    this.showConfirmNewPassword = !this.showConfirmNewPassword;
  }

  passwordValidator(control: any) {
    const value = control.value;

    if (!value) {
      return null; // No error if empty (let required validator handle it)
    }

    // Check for at least 6 characters
    if (value.length < 6) {
      return { minLength: true };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      return { noUpperCase: true };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(value)) {
      return { noLowerCase: true };
    }

    // Check for at least one number
    if (!/\d/.test(value)) {
      return { noNumber: true };
    }

    // Check for at least one special character
    if (!/[^A-Za-z0-9]/.test(value)) {
      return { noSpecialChar: true };
    }

    return null; // Valid password
  }
}