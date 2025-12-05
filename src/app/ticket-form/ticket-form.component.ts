import { Component, inject, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
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
  // Error messages per field
  fieldErrors: {
    equipmentId?: string;
    modelName?: string;
    note?: string;
    // status will be commented as requested
  } = {};
  isEquipmentDropdownOpen = false;
  isServicesDropdownOpen = false;
  selectedEquipmentName: string | null = null;

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
      this.selectedEquipmentName = selected.equipment ? selected.equipment + ' - ' + selected.modelName : selected.modelName;
    }
  }

  selectEquipment(equipmentId: number, equipmentName: string, modelName: string) {
    this.ticket.equipmentId = equipmentId;
    this.ticket.modelName = modelName;
    this.selectedEquipmentName = equipmentName ? equipmentName + ' - ' + modelName : modelName;
    this.isEquipmentDropdownOpen = false;
    this.onEquipmentChange();
  }

  toggleServiceSelection(serviceId: number) {
    const index = this.selectedServiceIds.indexOf(serviceId);
    if (index > -1) {
      this.selectedServiceIds.splice(index, 1);
    } else {
      this.selectedServiceIds.push(serviceId);
    }
  }

  isSelectedService(serviceId: number): boolean {
    return this.selectedServiceIds.includes(serviceId);
  }

  // onServiceChange is replaced by toggleServiceSelection and isSelectedService methods
  // keeping it for compatibility in case it's called elsewhere
  onServiceChange(event: Event, serviceId: number) {
    // This method is deprecated with the new dropdown design
    // Kept for backward compatibility if called elsewhere
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
    // Reset field errors
    this.fieldErrors = {};

    // Additional validation for required fields
    if (!this.ticket.equipmentId) {
      this.fieldErrors.equipmentId = 'Equipment is required.';
    }

    if (!this.ticket.modelName || this.ticket.modelName.trim() === '') {
      this.fieldErrors.modelName = 'Equipment model name is required.';
    }

    if (!this.ticket.note || this.ticket.note.trim() === '') {
      this.fieldErrors.note = 'Description/note is required.';
    }

    // Cek apakah ada error field
    const hasFieldErrors = Object.values(this.fieldErrors).some(error => error);
    if (hasFieldErrors) {
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

      // Create the payload object with required fields based on API spec
      const payload: any = {
        equipmentId: Number(this.ticket.equipmentId),
        modelName: String(this.ticket.modelName || ''),
        latitude: Number(this.ticket.latitude || 0),
        longitude: Number(this.ticket.longitude || 0),
        description: String(this.ticket.note || ''),
        note: String(this.ticket.note || ''), // Include both description and note
        status: String(statusId),
        createBy: 1 // Add createBy field which might be required
      };

      // Only add details if there are selected services
      if (this.selectedServiceIds && this.selectedServiceIds.length > 0) {
        payload.details = this.selectedServiceIds.map(id => ({ ServiceId: Number(id) }));
      }

      console.log('Creating ticket with payload:', payload);

      // Validate that the payload is a valid JSON before stringifying
      try {
        JSON.stringify(payload);
      } catch (e) {
        console.error('Invalid payload JSON:', e);
        this.errorMsg = 'Invalid ticket data format.';
        this.isLoading = false;
        return;
      }

      // Add the payload as a JSON string in the 'param' field
      formData.append('param', JSON.stringify(payload));

      // Add file if selected with validation
      if (this.selectedFile) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(this.selectedFile.type)) {
          this.errorMsg = 'Only image files (JPEG, PNG, GIF) are allowed.';
          this.isLoading = false;
          return;
        }

        // Validate file size (e.g., max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (this.selectedFile.size > maxSize) {
          this.errorMsg = 'File size exceeds 5MB limit.';
          this.isLoading = false;
          return;
        }

        formData.append('file', this.selectedFile, this.selectedFile.name);
      }

      // Debug: Log what's in the FormData before sending
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      this.requestService.createRequest(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Ticket created successfully via POST /api/Request', response);
          this.router.navigate(['/ticket-list']);
        },
        error: (err) => {
          console.error('Create ticket failed:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.message);
          console.error('Error details:', err);

          this.isLoading = false;

          // Enhanced error handling with more detailed information
          let errorMessage = 'Failed to create ticket. Please try again.';

          if (err && err.error) {
            if (typeof err.error === 'string') {
              // Try to parse if it's a JSON string
              try {
                const parsedError = JSON.parse(err.error);
                if (parsedError.message) {
                  errorMessage = `Server error: ${parsedError.message}`;
                } else if (parsedError.Message) {
                  errorMessage = `Server error: ${parsedError.Message}`;
                } else {
                  errorMessage = `Server error: ${err.error}`;
                }
              } catch (e) {
                // If it's not JSON, use as is
                errorMessage = `Server error: ${err.error}`;
              }
            } else if (err.error?.message) {
              errorMessage = `Server error: ${err.error.message}`;
            } else if (err.error?.Message) {
              errorMessage = `Server error: ${err.error.Message}`;
            } else if (err.statusText) {
              errorMessage = `HTTP ${err.status}: ${err.statusText}`;
            } else if (typeof err.error === 'object') {
              errorMessage = `Validation error: ${JSON.stringify(err.error)}`;
            }
          } else if (err.message) {
            errorMessage = `Request error: ${err.message}`;
          } else if (err.statusText) {
            errorMessage = `HTTP ${err.status}: ${err.statusText}`;
          } else {
            errorMessage = `HTTP Error ${err.status}`;
          }

          this.errorMsg = errorMessage;
          console.error('Detailed error message:', errorMessage);
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.equipment-dropdown') && !target.closest('.services-dropdown')) {
      this.isEquipmentDropdownOpen = false;
      this.isServicesDropdownOpen = false;
    }
  }
}