/**
 * Request DTO for label verification endpoint
 * Maps HTTP request body to structured data
 */
export interface VerifyLabelRequest {
  brandName: string;
  productType: string;
  alcoholContent: string;
  netContentsValue?: string;
  netContentsUnit?: string;
  image: Express.Multer.File;
}