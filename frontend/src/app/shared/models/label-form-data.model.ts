/**
 * Form data for label verification
 * Based on TTB label application requirements
 */
export interface LabelFormData {
  /** Brand name (e.g., "Old Tom Distillery") */
  brandName: string;

  /** Product class/type (e.g., "Kentucky Straight Bourbon Whiskey", "IPA") */
  productType: string;

  /** Alcohol by volume percentage (0-100) */
  alcoholContent: number;

  /** Net contents/volume (e.g., "750 mL", "12 fl oz") - Optional */
  netContents?: string;
}