import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css'
})
export class RoleFormComponent implements OnInit {
  role: any = {
    roleName: ''
  };
  isEditMode = false;
  isLoading = false;
  errorMsg = '';
  
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadRole(Number(id));
    }
  }

  loadRole(id: number) {
    this.isLoading = true;
    this.requestService.getRoleById(id).subscribe({
      next: (data) => {
        this.role = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load role', err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load role details.';
      }
    });
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';

    if (!this.role.roleName) {
      this.errorMsg = 'Role Name is required';
      this.isLoading = false;
      return;
    }

    if (this.isEditMode) {
      this.requestService.updateRole(this.role).subscribe({
        next: () => {
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Failed to update role', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to update role.';
        }
      });
    } else {
      this.requestService.createRole(this.role).subscribe({
        next: () => {
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Failed to create role', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to create role.';
        }
      });
    }
  }
}
