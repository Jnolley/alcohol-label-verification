import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VerificationRequest } from '../../../shared/models/verification-request.model';
import { VerificationResult } from '../../../shared/models/verification-result.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  verifyLabel(request: VerificationRequest): Observable<VerificationResult> {
    const formData = new FormData();
    formData.append('brandName', request.formData.brandName);
    formData.append('productType', request.formData.productType);
    formData.append('alcoholContent', request.formData.alcoholContent.toString());

    if (request.formData.netContentsValue && request.formData.netContentsUnit) {
      formData.append('netContentsValue', request.formData.netContentsValue.toString());
      formData.append('netContentsUnit', request.formData.netContentsUnit);
    }

    if (request.primaryImage) {
      formData.append('primaryImage', request.primaryImage);
    }
    if (request.secondaryImage) {
      formData.append('secondaryImage', request.secondaryImage);
    }

    return this.http.post<VerificationResult>(`${this.apiUrl}/verify`, formData);
  }
}
