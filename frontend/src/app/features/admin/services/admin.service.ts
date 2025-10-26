import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Submission, SubmissionsResponse, SubmissionResponse, SubmissionStatus } from '../../../shared/models/submission.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  login(username: string, password: string): Observable<{ success: boolean; message: string }> {
    const headers = new HttpHeaders({
      Authorization: this.getBasicAuthHeader(username, password),
    });

    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/login`,
      { username, password },
      { headers }
    );
  }

  getSubmissions(status?: SubmissionStatus): Observable<SubmissionsResponse> {
    const headers = this.getAuthHeaders();
    const options: { headers: HttpHeaders; params?: { status: SubmissionStatus } } = { headers };

    if (status) {
      options.params = { status };
    }

    return this.http.get<SubmissionsResponse>(`${this.baseUrl}/submissions`, options);
  }

  getSubmission(id: string): Observable<SubmissionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<SubmissionResponse>(`${this.baseUrl}/submissions/${id}`, { headers });
  }

  updateSubmission(
    id: string,
    status: SubmissionStatus,
    adminNotes?: string
  ): Observable<SubmissionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.patch<SubmissionResponse>(
      `${this.baseUrl}/submissions/${id}`,
      {
        status,
        adminNotes,
        reviewedBy: 'admin',
      },
      { headers }
    );
  }

  private getBasicAuthHeader(username: string, password: string): string {
    const credentials = btoa(`${username}:${password}`);
    return `Basic ${credentials}`;
  }

  private getAuthHeaders(): HttpHeaders {
    const credentials = localStorage.getItem('admin_credentials');
    if (!credentials) {
      throw new Error('Not authenticated');
    }

    return new HttpHeaders({
      Authorization: `Basic ${credentials}`,
    });
  }
}