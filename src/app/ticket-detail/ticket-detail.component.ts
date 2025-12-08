import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RequestService } from '../services/request.service';
import { Ticket } from '../models/user.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {
  request: Ticket | null = null;
  isLoading = true;
  private route = inject(ActivatedRoute);
  private requestService = inject(RequestService);
  private sanitizer = inject(DomSanitizer);

  imageBlobUrl: string | null = null;
  isStatusDropdownOpen = false;
  isAddNoteOpen = false;
  newNote = '';
  isSubmittingNote = false;

  ngOnInit() {
    // Get ID from params, support both string and number formats if needed
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;

    if (id) {
      this.loadRequest(id);
    } else {
      console.error('Invalid or missing Request ID');
      this.isLoading = false;
    }
  }
  
  loadRequest(id: number) {
    // Try to get request data, handling potential auth errors gracefully
    this.requestService.getRequestById(id).subscribe({
      next: (data) => {
        console.log('Request Data:', data);
        this.request = data || null;
        this.isLoading = false;
        if (this.request?.capture) {
           console.log('Loading image for:', this.request.capture);
           this.loadImage(this.request.capture);
        }
      },
      error: (err) => {
        console.error('Request failed:', err);
        // Set to null to show empty state, but page should still be visible
        this.request = null;
        this.isLoading = false;
      }
    });
  }

  loadImage(filename: string) {
    this.requestService.getCaptureImage(filename).subscribe({
      next: (blob) => {
        this.imageBlobUrl = URL.createObjectURL(blob);
      },
      error: (err) => {
        console.error('Failed to load image blob', err);
      }
    });
  }

  updateStatus(status: string) {
    this.isStatusDropdownOpen = false; // Close dropdown on selection
    if (!this.request?.id) return;
    
    let statusId = 1;
    switch(status) {
       case 'Open': statusId = 1; break;
       case 'In Progress': statusId = 2; break;
       case 'Reject': statusId = 3; break;
       case 'Closed': statusId = 4; break;
    }

    // Optimistic update
    const oldStatus = this.request.status;
    this.request.status = status;

    this.requestService.updateTicketStatus(this.request.id, statusId).subscribe({
      next: () => {
        console.log('Status updated successfully');
      },
      error: (err) => {
        console.error('Failed to update status', err);
        // Revert on error
        if (this.request) this.request.status = oldStatus;
      }
    });
  }

  submitNote() {
    if (!this.request?.id || !this.newNote.trim()) return;
    
    this.isSubmittingNote = true;
    
    // Map current status to numeric string as expected by backend
    let statusId = '1';
    switch(this.request.status) {
       case 'Open': statusId = '1'; break;
       case 'In Progress': statusId = '2'; break;
       case 'Reject': statusId = '3'; break;
       case 'Closed': statusId = '4'; break;
    }

    this.requestService.addTicketNote(this.request.id, this.newNote, statusId).subscribe({
      next: () => {
        console.log('Note added successfully');
        this.isSubmittingNote = false;
        this.isAddNoteOpen = false;
        this.newNote = '';
        // Ideally reload history or append to local history if we had one
      },
      error: (err) => {
        console.error('Failed to add note', err);
        this.isSubmittingNote = false;
      }
    });
  }

  getStatusColor(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'in progress':
      case 'on progress': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'reject': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'close':
      case 'closed': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  }

}
