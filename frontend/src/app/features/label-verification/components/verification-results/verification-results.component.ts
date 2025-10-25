import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationResult } from '../../../../shared/models/verification-result.model';
import { MatchStatus } from '../../../../shared/enums/match-status.enum';
import { FieldType } from '../../../../shared/enums/field-type.enum';
import { ICONS } from '../../../../shared/constants/icons';

@Component({
  selector: 'app-verification-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification-results.component.html'
})
export class VerificationResultsComponent {
  result = input.required<VerificationResult>();

  // Expose enums and icons to template
  readonly MatchStatus = MatchStatus;
  readonly icons = ICONS;

  getFieldLabel(fieldType: FieldType): string {
    switch (fieldType) {
      case FieldType.BrandName:
        return 'Brand Name';
      case FieldType.ProductType:
        return 'Product Class/Type';
      case FieldType.AlcoholContent:
        return 'Alcohol Content';
      case FieldType.NetContents:
        return 'Net Contents';
      case FieldType.GovernmentWarning:
        return 'Government Warning';
      default:
        return fieldType;
    }
  }

  getStatusClass(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.Match:
        return 'bg-green-50 border-success text-success';
      case MatchStatus.Mismatch:
        return 'bg-red-50 border-error text-error';
      case MatchStatus.NotFound:
        return 'bg-yellow-50 border-warning text-warning';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-500';
    }
  }
}