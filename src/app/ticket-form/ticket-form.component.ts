import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';
import { Ticket } from '../models/user.model';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.css'
})
export class TicketFormComponent implements OnInit {
  @ViewChild('hiddenFileInput') hiddenFileInput!: ElementRef<HTMLInputElement>;

  ticket: any = {
    status: 'Open',
    note: '',
    equipmentId: null,
    modelName: '',
    latitude: 0.0,
    longitude: 0.0,
    description: '',
    details: []
  };
  equipments: any[] = [];
  services: any[] = [];
  selectedServiceIds: number[] = [];
  
  isEditMode = false;
  isLoading = false;
  errorMsg = '';
  
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.loadEquipments();
    this.loadServices();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadRequest(Number(id));
    }
  }

  loadEquipments() {
    this.requestService.getEquipments().subscribe({
      next: (data) => {
        this.equipments = Array.isArray(data) ? data : (data as any).content || [];
      },
      error: (err) => console.error('Failed to load equipments', err)
    });
  }

  loadServices() {
    this.requestService.getServices().subscribe({
      next: (data) => {
        this.services = Array.isArray(data) ? data : (data as any).content || [];
      },
      error: (err) => console.error('Failed to load services', err)
    });
  }

  onEquipmentChange() {
    const selected = this.equipments.find(e => e.id == this.ticket.equipmentId);
    if (selected) {
      this.ticket.modelName = selected.modelName;
    }
  }

  onServiceChange(event: Event, serviceId: number) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedServiceIds.push(serviceId);
    } else {
      this.selectedServiceIds = this.selectedServiceIds.filter(id => id !== serviceId);
    }
  }

  loadRequest(id: number) {
    this.isLoading = true;
    this.requestService.getRequestById(id).subscribe({
      next: (data) => {
        if (data) {
          this.ticket = { ...data };
          // If editing, existing capture is a URL string, not a file. 
          // We can show it if needed, but imagePreview is for new file.
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load ticket details.';
      }
    });
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';

    // Validation
    if (!this.ticket.equipmentId) {
      this.errorMsg = 'Please select an equipment.';
      this.isLoading = false;
      return;
    }

    if (this.isEditMode) {
      this.requestService.updateRequest(this.ticket).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/ticket-list']);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.errorMsg = 'Failed to update ticket.';
        }
      });
    } else {
      // Create new ticket - API: POST /api/Request
      const formData = new FormData();
      
      let statusId = 1;
      switch(this.ticket.status) {
          case 'Open': statusId = 1; break;
          case 'In Progress': statusId = 2; break;
          case 'Reject': statusId = 3; break;
          case 'Closed': statusId = 4; break;
          default: statusId = 1;
      }

      const payload = {
        equipmentId: this.ticket.equipmentId,
        modelName: this.ticket.modelName,
        latitude: this.ticket.latitude || 0.0,
        longitude: this.ticket.longitude || 0.0,
        description: this.ticket.note,
        status: statusId.toString(),
        details: this.selectedServiceIds.map(id => ({ ServiceId: id }))
      };

      // API expects 'param' field with JSON string
      formData.append('param', JSON.stringify(payload));

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
        formData.append('Name', 'file');
        formData.append('FileName', this.selectedFile.name);
        formData.append('ContentType', this.selectedFile.type);
        formData.append('Length', this.selectedFile.size.toString());
        formData.append('ContentDisposition', `form-data; name="file"; filename="${this.selectedFile.name}"`);
        formData.append('Headers', '{}');
      }

      this.requestService.createRequest(formData).subscribe({
        next: () => {
          this.isLoading = false;
          console.log('Ticket created successfully via POST /api/Request');
          this.router.navigate(['/ticket-list']);
        },
        error: (err) => {
          console.error('Create ticket failed:', err);
          this.isLoading = false;
          this.errorMsg = 'Failed to create ticket. Please try again.';
        }
      });
    }
  }
}
