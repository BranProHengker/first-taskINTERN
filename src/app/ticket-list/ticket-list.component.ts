import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../services/request.service';
import { Ticket } from '../models/user.model';
import { ChangeDetectorRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataRefreshService } from '../services/data-refresh.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = true;
  activeTab = 'All';
  searchTerm = '';
  errorMsg = '';

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private dataRefreshService = inject(DataRefreshService);

  private refreshSubscription: Subscription | undefined;

  constructor(private requestService: RequestService) {}

  ngOnInit() {
    this.loadRequests();

    // Subscribe to refresh events from other components
    this.refreshSubscription = this.dataRefreshService.refresh$.subscribe(shouldRefresh => {
      if (shouldRefresh) {
        // Load requests when refresh is triggered
        this.loadRequests();
        // Reset the refresh flag after loading
        setTimeout(() => {
          this.dataRefreshService.resetRefreshFlag();
        }, 100); // Small delay to ensure loading is complete
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadRequests() {
    console.log('TicketList: Starting to load tickets...');
    this.isLoading = true;
    this.errorMsg = '';
    // Ensure change detection runs before showing loading state
    this.cdr.detectChanges();

    this.requestService.getRequests().subscribe({
      next: (data) => {
        console.log('TicketList: Received ticket data:', data);
        this.tickets = data;
        this.filterTickets();
        this.isLoading = false;
        console.log('TicketList: Data loaded, tickets:', this.tickets.length);
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('TicketList: Failed to load tickets', err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load tickets. ' + (err.message || 'Server error');
        this.tickets = [];
        this.filterTickets();
        // Trigger change detection to ensure the UI updates
        this.cdr.detectChanges();
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.filterTickets();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterTickets();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterTickets();
  }

  filterTickets() {
    console.log('TicketList: Applying filters, total tickets:', this.tickets.length, 'activeTab:', this.activeTab, 'searchTerm:', this.searchTerm);
    let result = this.tickets;

    // Filter by Status
    if (this.activeTab !== 'All') {
      // Handle "On Progress" mapping if API uses "In Progress" or vice versa
      // Assuming API uses "In Progress" but UI wants "On Progress"
      let filterStatus = this.activeTab;
      if (filterStatus === 'On Progress') filterStatus = 'In Progress';
      if (filterStatus === 'Close') filterStatus = 'Closed'; // Handle potential naming mismatch

      result = result.filter(t => {
         const status = t.status?.toLowerCase() || '';
         const filter = filterStatus.toLowerCase();

         // Flexible matching
         if (filter === 'in progress' && (status === 'on progress' || status === 'in progress')) return true;
         if (filter === 'closed' && (status === 'close' || status === 'closed')) return true;

         return status === filter;
      });
      console.log('TicketList: After status filter:', result.length);
    }

    // Filter by Search Term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(t =>
        (t.subject && t.subject.toLowerCase().includes(term)) ||
        (t.requestNo && t.requestNo.toLowerCase().includes(term)) ||
        (t.note && t.note.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.id && t.id.toString().includes(term)) ||
        (t.status && t.status.toLowerCase().includes(term)) || // Added status search
        (t.createBy && t.createBy.toString().includes(term))   // Added User ID search
      );
      console.log('TicketList: After search filter:', result.length);
    }

    this.filteredTickets = result;
    console.log('TicketList: Final filtered tickets count:', this.filteredTickets.length);

    // Trigger change detection after filtering to ensure UI updates
    this.cdr.detectChanges();
  }

  getStatusColor(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'open': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'in progress':
      case 'on progress': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'reject': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'close':
      case 'closed': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  }

  deleteTicket(id: number) {
    if (confirm('Are you sure you want to delete this ticket?')) {
      this.requestService.deleteRequest(id).subscribe({
        next: (response) => {
          console.log('Ticket deleted successfully', response);
          // Remove the ticket from the local array and update the UI immediately
          this.tickets = this.tickets.filter(t => t.id !== id);
          this.filterTickets();
          // Trigger change detection after deletion to ensure UI updates immediately
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to delete ticket', err);
          alert('Failed to delete ticket. Please try again.');
          // Trigger change detection to ensure UI updates in case of error
          this.cdr.detectChanges();
        }
      });
    }
  }
}
