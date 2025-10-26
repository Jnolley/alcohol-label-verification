import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Submission, SubmissionStatus } from '../../../../shared/models/submission.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  submissions = signal<Submission[]>([]);
  filteredSubmissions = signal<Submission[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  activeFilter = signal<SubmissionStatus | 'all'>('all');

  readonly SubmissionStatus = SubmissionStatus;

  pendingCount = computed(() =>
    this.submissions().filter(s => s.status === SubmissionStatus.PENDING).length
  );
  approvedCount = computed(() =>
    this.submissions().filter(s => s.status === SubmissionStatus.APPROVED).length
  );
  rejectedCount = computed(() =>
    this.submissions().filter(s => s.status === SubmissionStatus.REJECTED).length
  );

  ngOnInit(): void {
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getSubmissions().subscribe({
      next: (response) => {
        this.submissions.set(response.submissions);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load submissions. Please try again.');
        console.error('Error loading submissions:', err);
      },
    });
  }

  filterBy(status: SubmissionStatus | 'all'): void {
    this.activeFilter.set(status);
    this.applyFilter();
  }

  private applyFilter(): void {
    const filter = this.activeFilter();
    if (filter === 'all') {
      this.filteredSubmissions.set(this.submissions());
    } else {
      this.filteredSubmissions.set(
        this.submissions().filter((s) => s.status === filter)
      );
    }
  }

  getStatusBadgeClass(status: SubmissionStatus): string {
    switch (status) {
      case SubmissionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case SubmissionStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case SubmissionStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
