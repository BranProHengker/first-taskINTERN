import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';
import { Ticket } from '../models/user.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = true;
  activeTab = 'All';
  searchTerm = '';
  errorMsg = '';

  constructor(private requestService: RequestService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.errorMsg = '';
    this.requestService.getRequests().subscribe({
      next: (data) => {
        this.tickets = data;
        this.filterTickets();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.errorMsg = 'Failed to load tickets. ' + (err.message || 'Server error');
        this.tickets = [];
        this.filterTickets();
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

  filterTickets() {
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
    }

    this.filteredTickets = result;
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
        next: () => {
          this.tickets = this.tickets.filter(t => t.id !== id);
          this.filterTickets();
        },
        error: (err) => {
          console.error('Failed to delete ticket', err);
          alert('Failed to delete ticket. Please try again.');
        }
      });
    }
  }
}
