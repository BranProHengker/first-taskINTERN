import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { EquipmentService } from '../services/equipment.service';
import { Equipment } from '../models/equipment.model';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './equipment-form.component.html',
  styleUrl: './equipment-form.component.css'
})
export class EquipmentFormComponent implements OnInit {
  equipment: Partial<Equipment> = {
    modelName: '',
    description: '',
    location: '',
    equipment: undefined
  };
  isEditMode = false;
  isLoading = false;
  errorMsg = '';
  fieldErrors: {
    equipmentNumber?: string;
    modelName?: string;
    location?: string;
    description?: string;
  } = {};

  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadEquipment(Number(id));
    }
  }

  loadEquipment(id: number) {
    this.isLoading = true;
    this.equipmentService.getEquipmentById(id).subscribe({
      next: (data) => {
        this.equipment = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load equipment', err);
        this.errorMsg = 'Failed to load equipment details.';
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';
    // Reset field errors
    this.fieldErrors = {};

    // Validasi field-field wajib
    if (!this.equipment.equipment) {
      this.fieldErrors.equipmentNumber = 'Equipment Number is required';
    }

    if (!this.equipment.modelName?.trim()) {
      this.fieldErrors.modelName = 'Model Name is required';
    }

    // Validasi field location (opsional)
    if (this.equipment.location && this.equipment.location.trim().length < 3) {
      this.fieldErrors.location = 'Location must be at least 3 characters long';
    }

    // Validasi field description (opsional)
    if (this.equipment.description && this.equipment.description.trim().length < 5) {
      this.fieldErrors.description = 'Description must be at least 5 characters long';
    }

    // Cek apakah ada error field
    const hasFieldErrors = Object.values(this.fieldErrors).some(error => error);
    if (hasFieldErrors) {
      this.isLoading = false;
      return;
    }

    if (this.isEditMode) {
      this.equipmentService.updateEquipment(this.equipment).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/equipments']);
        },
        error: (err) => {
          console.error('Error updating equipment', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to update equipment. Please try again.';
        }
      });
    } else {
      this.equipmentService.createEquipment(this.equipment).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/equipments']);
        },
        error: (err) => {
          console.error('Error creating equipment', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to create equipment. Please try again.';
        }
      });
    }
  }
}
