import { FormData } from '../../common';
import { VerifyLabelRequest } from '../contracts/requests/verify-label.request';

export class RequestMapper {
  static toFormData(request: VerifyLabelRequest): FormData {
    return {
      brandName: request.brandName,
      productType: request.productType,
      alcoholContent: parseFloat(request.alcoholContent),
      netContentsValue: request.netContentsValue ? parseFloat(request.netContentsValue) : undefined,
      netContentsUnit: request.netContentsUnit,
    };
  }
}