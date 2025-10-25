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

  /** Net contents volume value (e.g., 750, 12) - Optional */
  netContentsValue?: number;

  /** Net contents unit (e.g., "ml", "cl", "L", "fl oz") - Optional */
  netContentsUnit?: string;
}