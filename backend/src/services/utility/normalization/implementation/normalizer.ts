import { INormalizer } from '../interface/normalizer.interface';

export class Normalizer implements INormalizer {
  /**
   * Normalizes ABV (Alcohol By Volume) from text
   * Extracts percentage values from formats like: "13.5%", "13.5 %", "13.5% ABV", etc.
   * @param text The text to extract ABV from
   * @returns The normalized ABV as a number, or null if not found
   */
  normalizeAbv(text: string): number | null {
    if (!text) return null;

    const normalized = text.toUpperCase().trim();
    const percentIndex = normalized.indexOf('%');

    if (percentIndex === -1) return null;

    // Look backwards from % to find the number
    let numberStr = '';
    let i = percentIndex - 1;

    // Skip whitespace before %
    while (i >= 0 && normalized[i] === ' ') {
      i--;
    }

    // Extract the number (including decimal point)
    while (i >= 0 && (this.isDigit(normalized[i]) || normalized[i] === '.')) {
      numberStr = normalized[i] + numberStr;
      i--;
    }

    if (numberStr) {
      const value = parseFloat(numberStr);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        return value;
      }
    }

    return null;
  }

  /**
   * Normalizes volume from text
   * Extracts volume values and converts to milliliters (ml)
   * Handles formats like: "750ml", "750 ml", "750mL", "1.5L", "1.5 L", etc.
   * @param text The text to extract volume from
   * @returns The normalized volume in ml as a number, or null if not found
   */
  normalizeVolume(text: string): number | null {
    if (!text) return null;

    const normalized = text.toUpperCase().trim();

    // Check for CL, ML, or L units
    const clIndex = normalized.indexOf('CL');
    const mlIndex = normalized.indexOf('ML');
    const lIndex = normalized.indexOf('L');

    let unitIndex = -1;
    let unit = '';

    if (clIndex !== -1) {
      unitIndex = clIndex;
      unit = 'CL';
    } else if (mlIndex !== -1) {
      unitIndex = mlIndex;
      unit = 'ML';
    } else if (lIndex !== -1) {
      unitIndex = lIndex;
      unit = 'L';
    } else {
      return null;
    }

    // Look backwards from unit to find the number
    let numberStr = '';
    let i = unitIndex - 1;

    // Skip whitespace before unit
    while (i >= 0 && normalized[i] === ' ') {
      i--;
    }

    // Extract the number (including decimal point)
    while (i >= 0 && (this.isDigit(normalized[i]) || normalized[i] === '.')) {
      numberStr = normalized[i] + numberStr;
      i--;
    }

    if (numberStr) {
      const value = parseFloat(numberStr);

      if (isNaN(value) || value <= 0) {
        return null;
      }

      // Convert to milliliters
      if (unit === 'CL') {
        return value * 10;
      } else if (unit === 'L') {
        return value * 1000;
      } else {
        return value;
      }
    }

    return null;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
}