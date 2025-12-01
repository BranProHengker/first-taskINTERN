import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TicketService } from '../services/ticket.service';
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

  constructor(private ticketService: TicketService) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        this.filterTickets();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        // Remove fallback data to respect user request "bukan data dummy"
        // Or keep it empty to show "No tickets found" which is more accurate if API fails
        this.tickets = [];
        this.filterTickets();
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.filterTickets();
  }

  filterTickets() {
    if (this.activeTab === 'All') {
      this.filteredTickets = this.tickets;
    } else {
      this.filteredTickets = this.tickets.filter(t => t.status?.toLowerCase() === this.activeTab.toLowerCase());
    }
  }

  getStatusColor(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'open': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'in progress': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'closed': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  }
}
