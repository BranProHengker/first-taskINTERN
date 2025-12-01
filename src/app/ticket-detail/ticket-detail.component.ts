import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '../services/ticket.service';
import { Ticket } from '../models/user.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  isLoading = true;
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadTicket(id);
    }
  }

  loadTicket(id: number) {
    this.ticketService.getTicketById(id).subscribe({
      next: (data) => {
        this.ticket = data || null;
        this.isLoading = false;
        if (!this.ticket) {
           // handle not found
           console.warn('Ticket not found');
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        // Removed fallback mock
      }
    });
  }
}
