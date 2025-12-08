import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipmentService } from '../services/equipment.service';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './equipment-list.component.html',
  styleUrl: './equipment-list.component.css'
})
export class EquipmentListComponent implements OnInit {
  equipments: any[] = [];
  filteredEquipments: any[] = [];
  isLoading = true;
  errorMsg = '';
  searchTerm = '';
  private equipmentService = inject(EquipmentService);

  ngOnInit() {
    this.loadEquipments();
  }

  loadEquipments() {
    this.isLoading = true;
    this.errorMsg = '';
    this.equipmentService.getEquipments().subscribe({
      next: (data) => {
        this.equipments = Array.isArray(data) ? data : (data as any).content || [];
        this.filteredEquipments = [...this.equipments];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load equipments', err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load equipments. ' + (err.message || 'Server error');
      }
    });
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    const term = target.value.toLowerCase();
    this.filteredEquipments = this.equipments.filter(e =>
      e.id?.toString().toLowerCase().includes(term) ||
      e.equipment?.toString().toLowerCase().includes(term) ||
      e.modelName?.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term) ||
      e.location?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredEquipments = [...this.equipments]; // Reset to all equipments
  }

  deleteEquipment(id: number) {
    if (confirm('Are you sure you want to delete this equipment?')) {
      this.equipmentService.deleteEquipment(id).subscribe({
        next: () => {
          this.equipments = this.equipments.filter(e => e.id !== id);
          this.filteredEquipments = this.filteredEquipments.filter(e => e.id !== id);
        },
        error: (err) => {
          console.error('Failed to delete equipment', err);
          alert('Failed to delete equipment. Please try again.');
        }
      });
    }
  }
}
