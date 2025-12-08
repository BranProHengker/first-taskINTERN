import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  userService = inject(UserService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  currentUser = this.authService.getCurrentUser();
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showOldPassword = false;
  showNewPassword = false;

  changePasswordForm: FormGroup;

  constructor() {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        this.passwordValidator
      ]]
    });
  }


  onChangePasswordSubmit() {
    if (this.changePasswordForm.valid) {
      this.isSubmitting = true;
      this.message = '';

      const { oldPassword, newPassword } = this.changePasswordForm.value;

      this.userService.changePassword(oldPassword, newPassword).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.message = 'Password changed successfully!';
          this.messageType = 'success';
          this.changePasswordForm.reset();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.message = error.error?.message || 'Failed to change password. Please try again.';
          this.messageType = 'error';
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