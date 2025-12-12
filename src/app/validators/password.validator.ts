import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate if empty (let required validator handle it)
    }

    const value = control.value;

    // Check for at least 6 characters
    if (value.length < 6) {
      return { 
        minLength: { 
          requiredLength: 6, 
          actualLength: value.length 
        } 
      };
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
  };
}

export function passwordMatchValidator(password: string, confirmPassword: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const passwordControl = control.get(password);
    const confirmPasswordControl = control.get(confirmPassword);

    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    if (passwordControl.value !== confirmPasswordControl.value) {
      confirmPasswordControl.setErrors({ passwordsMismatch: true });
      return { passwordsMismatch: true };
    } else {
      // Clear the error if passwords match
      if (confirmPasswordControl.errors?.['passwordsMismatch']) {
        const errors = { ...confirmPasswordControl.errors };
        delete errors['passwordsMismatch'];
        confirmPasswordControl.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }
  };
}