import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css'
})
export class RoleListComponent implements OnInit {
  roles: any[] = [];
  isLoading = true;
  private requestService = inject(RequestService);

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoading = true;
    this.requestService.getRoles().subscribe({
      next: (data) => {
        this.roles = Array.isArray(data) ? data : (data as any).content || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.isLoading = false;
      }
    });
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.requestService.deleteRole(id).subscribe({
        next: () => {
          this.loadRoles();
        },
        error: (err) => console.error('Failed to delete role', err)
      });
    }
  }
}
