import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RequestService } from '../services/request.service';
import { Ticket } from '../models/user.model';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { DataRefreshService } from '../services/data-refresh.service';

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
  currentRequestId: number | null = null;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestService = inject(RequestService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private dataRefreshService = inject(DataRefreshService);

  private refreshSubscription: Subscription | undefined;

  imageBlobUrl: string | null = null;
  isStatusDropdownOpen = false;
  isAddNoteOpen = false;
  newNote = '';
  isSubmittingNote = false;

  ngOnInit() {
    console.log('TicketDetail: Starting to load ticket details...');
    // Get ID from params, support both string and number formats if needed
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;

    if (id) {
      this.currentRequestId = id;
      this.loadRequest(id);
    } else {
      console.error('Invalid or missing Request ID');
      this.isLoading = false;
      // Trigger change detection to ensure the UI updates
      this.cdr.detectChanges();
    }

    // Listen for navigation events to reload data when navigating to the same route with different params
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentIdParam = this.route.snapshot.paramMap.get('id');
        const currentId = currentIdParam ? Number(currentIdParam) : null;

        // Check if the route is still the same but the ID might have changed (or if the same ID was navigated to again)
        if (currentId && currentId !== this.currentRequestId) {
          // Load the new ticket if ID changed
          this.currentRequestId = currentId;
          this.loadRequest(currentId);
        } else if (currentId === this.currentRequestId) {
          // Reload the same ticket data if navigating to the same ticket again
          // This handles the case where the data might have been updated externally
          this.loadRequest
        }
      });

    // Subscribe to refresh events from other components
    this.refreshSubscription = this.dataRefreshService.refresh$.subscribe(shouldRefresh => {
      if (shouldRefresh && this.currentRequestId) {
        // Load the request when refresh is triggered
        this.loadRequest(this.currentRequestId);
        // Reset the refresh flag after loading
        setTimeout(() => {
          this.dataRefreshService.resetRefreshFlag();
        }, 100); // Small delay to ensure loading is complete
      }
    });
  }

  loadRequest(id: number) {
    console.log('TicketDetail: Loading ticket details for id:', id);
    // Use direct API call to get full request data with details
    this.isLoading = true;
    // Ensure change detection runs before showing loading state
    this.cdr.detectChanges();

    this.requestService.getRequestDirectById(id).subscribe({
      next: (data) => {
        console.log('TicketDetail: Request Data received:', data);
        this.request = data || null;
        this.isLoading = false;
        if (this.request?.capture) {
           console.log('TicketDetail: Loading image for:', this.request.capture);
           this.loadImage(this.request.capture);
        }
        console.log('TicketDetail: Data loaded, request:', this.request);
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();

        // Use setTimeout to ensure UI updates after all async operations
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('TicketDetail: Request failed:', err);
        // Set to null to show empty state, but page should still be visible
        this.request = null;
        this.isLoading = false;
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      }
    });
  }

  loadImage(filename: string) {
    // Revoke previous blob URL to prevent memory leaks if there was one
    if (this.imageBlobUrl) {
      URL.revokeObjectURL(this.imageBlobUrl);
      this.imageBlobUrl = null;
    }

    this.requestService.getCaptureImage(filename).subscribe({
      next: (blob) => {
        this.imageBlobUrl = URL.createObjectURL(blob);
        // Force change detection multiple times to ensure the UI updates
        this.cdr.detectChanges();

        // Additional change detection on next tick to ensure rendering
        Promise.resolve().then(() => {
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to load image blob', err);
        // Trigger change detection to ensure UI updates in case of error
        this.cdr.detectChanges();
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
    // Trigger change detection after optimistic update
    this.cdr.detectChanges();

    this.requestService.updateTicketStatus(this.request.id, statusId).subscribe({
      next: (response) => {
        console.log('Status updated successfully', response);
        // The API call succeeded, ensure the status remains as selected by user
        // Don't reload data which might cause flickering or race conditions
        this.request!.status = status;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        // Revert on error
        if (this.request) this.request.status = oldStatus;
        // Trigger change detection after reverting status
        this.cdr.detectChanges();
      }
    });
  }

  submitNote() {
    if (!this.request?.id || !this.newNote.trim()) return;

    this.isSubmittingNote = true;
    // Trigger change detection after setting submitting state
    this.cdr.detectChanges();

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
        // Trigger change detection after successful note submission
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to add note', err);
        this.isSubmittingNote = false;
        // Trigger change detection after error
        this.cdr.detectChanges();
      }
    });
  }

  getStatusColor(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'in progress':
      case 'on progress': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'reject': return 'bg-red-500/10 text-yellow-400 border-red-500/20';
      case 'close':
      case 'closed': return 'bg-gray-500/10 text-yellow-400 border-gray-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    // Revoke the image blob URL to prevent memory leaks
    if (this.imageBlobUrl) {
      URL.revokeObjectURL(this.imageBlobUrl);
    }
  }

}