import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequestService } from '../services/request.service';
import { Ticket } from '../models/user.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {
  request: Ticket | null = null;
  isLoading = true;
  private route = inject(ActivatedRoute);
  private requestService = inject(RequestService);

  get captureImageUrl(): string | null {
    if (!this.request?.capture) return null;
    return this.requestService.getCaptureImage(this.request.capture);
  }

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
    this.requestService.getRequestById(id).subscribe({
      next: (data) => {
        this.request = data || null;
        this.isLoading = false;
        if (!this.request) {
           // handle not found
           console.warn('Request not found');
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        // Removed fallback mock
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
