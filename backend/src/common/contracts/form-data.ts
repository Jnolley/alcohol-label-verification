/**
 * Domain model for label form data
 * Contains the data submitted by the user for verification
 */
export interface FormData {
  /** Brand name to verify */
  brandName: string;

  /** Product class/type to verify */
  productType: string;

  /** Alcohol by volume percentage */
  alcoholContent: number;

  /** Net contents volume value (optional) */
  netContentsValue?: number;

  /** Net contents unit (ml, cl, L, fl oz, gal) (optional) */
  netContentsUnit?: string;
}