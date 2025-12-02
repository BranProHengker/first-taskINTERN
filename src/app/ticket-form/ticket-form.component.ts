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
    subject: ''
  };
  isEditMode = false;
  isLoading = false;
  errorMsg = '';
  
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadRequest(Number(id));
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
        requestNo: this.ticket.subject,
        note: this.ticket.note,
        status: statusId
      };

      formData.append('param', JSON.stringify(payload));

      if (this.ticket.subject) {
        formData.append('Name', this.ticket.subject);
      }

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
        formData.append('FileName', this.selectedFile.name);
        formData.append('ContentType', this.selectedFile.type);
        formData.append('Length', this.selectedFile.size.toString());
      }

      this.requestService.createRequest(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/ticket-list']);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.errorMsg = 'Failed to create ticket.';
        }
      });
    }
  }
}
