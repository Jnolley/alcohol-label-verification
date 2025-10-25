export interface VerifyLabelRequest {
  brandName: string;
  productType: string;
  alcoholContent: string;
  netContents?: string;
  image: Express.Multer.File;
}