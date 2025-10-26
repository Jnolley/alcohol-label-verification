import { Normalizer } from '../implementation/normalizer';

describe('Normalizer', () => {
  let normalizer: Normalizer;

  beforeEach(() => {
    normalizer = new Normalizer();
  });

  describe('normalizeVolume', () => {
    describe('milliliters (ml)', () => {
      it('should extract volume in ml', () => {
        expect(normalizer.normalizeVolume('750ml')).toBe(750);
        expect(normalizer.normalizeVolume('750ML')).toBe(750);
        expect(normalizer.normalizeVolume('750 ml')).toBe(750);
        expect(normalizer.normalizeVolume('750 ML')).toBe(750);
      });

      it('should handle decimal ml values', () => {
        expect(normalizer.normalizeVolume('750.0ml')).toBe(750);
        expect(normalizer.normalizeVolume('473.5ml')).toBe(473.5);
      });
    });

    describe('centiliters (cl)', () => {
      it('should convert cl to ml', () => {
        expect(normalizer.normalizeVolume('75cl')).toBe(750);
        expect(normalizer.normalizeVolume('75CL')).toBe(750);
        expect(normalizer.normalizeVolume('75 cl')).toBe(750);
      });

      it('should handle decimal cl values', () => {
        expect(normalizer.normalizeVolume('75.5cl')).toBe(755);
        expect(normalizer.normalizeVolume('47.3cl')).toBe(473);
      });
    });

    describe('liters (l)', () => {
      it('should convert liters to ml', () => {
        expect(normalizer.normalizeVolume('1L')).toBe(1000);
        expect(normalizer.normalizeVolume('1l')).toBe(1000);
        expect(normalizer.normalizeVolume('1 L')).toBe(1000);
        expect(normalizer.normalizeVolume('0.75L')).toBe(750);
      });

      it('should handle decimal liter values', () => {
        expect(normalizer.normalizeVolume('1.5L')).toBe(1500);
        expect(normalizer.normalizeVolume('0.5L')).toBe(500);
        expect(normalizer.normalizeVolume('2.25L')).toBe(2250);
      });
    });

    describe('mixed formats', () => {
      it('should handle various spacing', () => {
        expect(normalizer.normalizeVolume('750  ml')).toBe(750);
        expect(normalizer.normalizeVolume('1  L')).toBe(1000);
      });

      it('should handle case-insensitive units', () => {
        expect(normalizer.normalizeVolume('750Ml')).toBe(750);
        expect(normalizer.normalizeVolume('750mL')).toBe(750);
        expect(normalizer.normalizeVolume('1l')).toBe(1000);
      });
    });

    describe('invalid formats', () => {
      it('should return null for text without volume units', () => {
        expect(normalizer.normalizeVolume('750')).toBeNull();
        expect(normalizer.normalizeVolume('No volume')).toBeNull();
      });

      it('should return null for empty or null text', () => {
        expect(normalizer.normalizeVolume('')).toBeNull();
        expect(normalizer.normalizeVolume(null as any)).toBeNull();
        expect(normalizer.normalizeVolume(undefined as any)).toBeNull();
      });

      it('should return null for volume unit without number', () => {
        expect(normalizer.normalizeVolume('ml')).toBeNull();
        expect(normalizer.normalizeVolume('L')).toBeNull();
      });

      it('should return null for invalid volume values', () => {
        // Note: normalizer extracts values but doesn't validate ranges
        // Validation is done in the validation layer
        expect(normalizer.normalizeVolume('abcml')).toBeNull(); // non-numeric
      });

      it('should return null for unsupported units', () => {
        expect(normalizer.normalizeVolume('25.4 pints')).toBeNull();
        expect(normalizer.normalizeVolume('1 quart')).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle volume at text beginning', () => {
        expect(normalizer.normalizeVolume('750ml bottle of wine')).toBe(750);
      });

      it('should handle volume at text end', () => {
        expect(normalizer.normalizeVolume('Net contents: 750ml')).toBe(750);
      });

      it('should extract first volume from text with multiple volumes', () => {
        expect(normalizer.normalizeVolume('750ml or 1L available')).toBe(750);
      });

      it('should handle very small volumes', () => {
        expect(normalizer.normalizeVolume('50ml')).toBe(50);
        expect(normalizer.normalizeVolume('0.05L')).toBe(50);
      });

      it('should handle very large volumes', () => {
        expect(normalizer.normalizeVolume('5000ml')).toBe(5000);
        expect(normalizer.normalizeVolume('5L')).toBe(5000);
      });

      it('should prioritize CL over L when both present', () => {
        // If text contains "75CL", should return 750ml not 75000ml
        expect(normalizer.normalizeVolume('75CL')).toBe(750);
      });

      it('should prioritize ML over L when both present', () => {
        // If text contains "750ML", should return 750ml not 750000ml
        expect(normalizer.normalizeVolume('750ML')).toBe(750);
      });
    });

    describe('decimal precision', () => {
      it('should maintain decimal precision for ml', () => {
        expect(normalizer.normalizeVolume('473.5ml')).toBe(473.5);
      });

      it('should maintain decimal precision for cl conversions', () => {
        expect(normalizer.normalizeVolume('47.35cl')).toBe(473.5);
      });

      it('should maintain decimal precision for liter conversions', () => {
        expect(normalizer.normalizeVolume('0.4735L')).toBe(473.5);
      });
    });
  });
});