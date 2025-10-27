import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Submission, SubmissionStatus } from '../../../../shared/models/submission.model';
import { ImageAnnotatorComponent } from '../../components/image-annotator/image-annotator.component';
import { MatchStatus } from '../../../../shared/enums/match-status.enum';

@Component({
  selector: 'app-submission-detail',
  imports: [CommonModule, FormsModule, ImageAnnotatorComponent],
  templateUrl: './submission-detail.component.html',
  styleUrl: './submission-detail.component.css'
})
export class SubmissionDetailComponent implements OnInit {
  submission = signal<Submission | null>(null);
  adminNotes = '';
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Expose enums for template
  SubmissionStatus = SubmissionStatus;
  MatchStatus = MatchStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSubmission(id);
    }
  }

  private loadSubmission(id: string): void {
    this.adminService.getSubmission(id).subscribe({
      next: (response) => {
        this.submission.set(response.submission);
        this.adminNotes = response.submission.adminNotes || '';
      },
      error: (err: Error) => {
        this.error.set('Failed to load submission');
      }
    });
  }

  approve(): void {
    const sub = this.submission();
    if (!sub) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    this.adminService.updateSubmission(
      sub.id,
      SubmissionStatus.APPROVED,
      this.adminNotes
    ).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: Error) => {
        console.error('Failed to approve submission:', err);
        this.error.set('Failed to approve submission');
        this.isSubmitting.set(false);
      }
    });
  }

  reject(): void {
    const sub = this.submission();
    if (!sub) return;

    if (!this.adminNotes.trim()) {
      this.error.set('Please provide a reason for rejection');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.adminService.updateSubmission(
      sub.id,
      SubmissionStatus.REJECTED,
      this.adminNotes
    ).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: Error) => {
        console.error('Failed to reject submission:', err);
        this.error.set('Failed to reject submission');
        this.isSubmitting.set(false);
      }
    });
  }

  getStatusBadgeClass(status: SubmissionStatus): string {
    switch (status) {
      case SubmissionStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case SubmissionStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case SubmissionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getMatchStatusBadgeClass(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.Match:
        return 'bg-green-100 text-green-800';
      case MatchStatus.Mismatch:
      case MatchStatus.NotFound:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
