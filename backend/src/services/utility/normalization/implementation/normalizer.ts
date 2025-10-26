import { INormalizer } from '../interface/normalizer.interface';
import convert from 'convert-units';

export class Normalizer implements INormalizer {
  /**
   * Normalizes volume from text
   * Extracts volume values and converts to milliliters (ml)
   * Handles formats like: "750ml", "750 ml", "750mL", "1.5L", "1.5 L", "12 fl oz", "12 FL. OZ.", etc.
   * @param text The text to extract volume from
   * @returns The normalized volume in ml as a number, or null if not found
   */
  normalizeVolume(text: string): number | null {
    if (!text) return null;

    let normalized = text.toUpperCase().trim();
    // Remove periods that are likely abbreviation markers (followed by space or end of string)
    // but preserve decimal points in numbers
    normalized = normalized.replace(/\.(\s|$)/g, '$1');
    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ');

    // Try to find units in order of specificity (most specific first)

    // Check for FL OZ or FLOZ (fluid ounces)
    let flOzIndex = normalized.indexOf('FL OZ');
    if (flOzIndex === -1) {
      flOzIndex = normalized.indexOf('FLOZ');
    }
    if (flOzIndex !== -1) {
      const numberStr = this.extractNumberBeforeUnit(normalized, flOzIndex);
      if (numberStr) {
        const value = parseFloat(numberStr);
        if (!isNaN(value) && value > 0) {
          return convert(value).from('fl-oz').to('ml');
        }
      }
    }

    // Check for GAL (gallons)
    const galIndex = normalized.indexOf('GAL');
    if (galIndex !== -1) {
      const numberStr = this.extractNumberBeforeUnit(normalized, galIndex);
      if (numberStr) {
        const value = parseFloat(numberStr);
        if (!isNaN(value) && value > 0) {
          return convert(value).from('gal').to('ml');
        }
      }
    }

    // Check for OZ (ounces, but not part of FL OZ)
    let ozIndex = normalized.indexOf('OZ');
    if (ozIndex !== -1) {
      // Make sure it's not part of FL OZ or FLOZ
      const beforeOz = ozIndex >= 2 ? normalized.substring(ozIndex - 2, ozIndex) : '';
      const beforeOz3 = ozIndex >= 3 ? normalized.substring(ozIndex - 3, ozIndex) : '';
      if (beforeOz !== 'FL' && beforeOz3 !== 'FL ' && beforeOz !== 'LO') {
        const numberStr = this.extractNumberBeforeUnit(normalized, ozIndex);
        if (numberStr) {
          const value = parseFloat(numberStr);
          if (!isNaN(value) && value > 0) {
            return convert(value).from('fl-oz').to('ml');
          }
        }
      }
    }

    // Check for full unit names first (more specific)
    const millilitersIndex = normalized.indexOf('MILLILITERS');
    const millilitresIndex = normalized.indexOf('MILLILITRES');
    const centilitersIndex = normalized.indexOf('CENTILITERS');
    const centilitresIndex = normalized.indexOf('CENTILITRES');
    const litersIndex = normalized.indexOf('LITERS');
    const litresIndex = normalized.indexOf('LITRES');

    // Check for abbreviated units
    const clIndex = normalized.indexOf('CL');
    const mlIndex = normalized.indexOf('ML');
    const lIndex = normalized.indexOf('L');

    let unitIndex = -1;
    let unit = '';

    // Priority: full names first, then abbreviations
    if (millilitersIndex !== -1) {
      unitIndex = millilitersIndex;
      unit = 'ML';
    } else if (millilitresIndex !== -1) {
      unitIndex = millilitresIndex;
      unit = 'ML';
    } else if (centilitersIndex !== -1) {
      unitIndex = centilitersIndex;
      unit = 'CL';
    } else if (centilitresIndex !== -1) {
      unitIndex = centilitresIndex;
      unit = 'CL';
    } else if (litersIndex !== -1) {
      unitIndex = litersIndex;
      unit = 'L';
    } else if (litresIndex !== -1) {
      unitIndex = litresIndex;
      unit = 'L';
    } else if (clIndex !== -1) {
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

    const numberStr = this.extractNumberBeforeUnit(normalized, unitIndex);
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

  /**
   * Extracts a number from text that appears before a unit
   * @param text The text to search
   * @param unitIndex The index where the unit starts
   * @returns The number string, or empty string if not found
   */
  private extractNumberBeforeUnit(text: string, unitIndex: number): string {
    let numberStr = '';
    let i = unitIndex - 1;

    while (i >= 0 && text[i] === ' ') {
      i--;
    }

    while (i >= 0 && (this.isDigit(text[i]) || text[i] === '.')) {
      numberStr = text[i] + numberStr;
      i--;
    }

    return numberStr;
  }

  /**
   * Converts a volume value with a unit to milliliters
   * @param value The numeric value
   * @param unit The unit (ml, cl, L, fl oz, gal)
   * @returns The volume in milliliters
   */
  convertToMilliliters(value: number, unit: string): number {
    const normalizedUnit = unit.toLowerCase().trim();

    try {
      // Handle each unit explicitly
      if (normalizedUnit === 'ml') {
        return value;
      } else if (normalizedUnit === 'cl') {
        return convert(value).from('cl' as any).to('ml' as any);
      } else if (normalizedUnit === 'l') {
        return convert(value).from('l' as any).to('ml' as any);
      } else if (normalizedUnit === 'fl oz') {
        return convert(value).from('fl-oz' as any).to('ml' as any);
      } else if (normalizedUnit === 'gal') {
        return convert(value).from('gal' as any).to('ml' as any);
      }

      // Default to ml if unknown
      return value;
    } catch (error) {
      // Fallback if conversion fails
      return value;
    }
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
}