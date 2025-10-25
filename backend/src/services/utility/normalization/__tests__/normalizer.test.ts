import { Normalizer } from '../implementation/normalizer';

describe('Normalizer', () => {
  let normalizer: Normalizer;

  beforeEach(() => {
    normalizer = new Normalizer();
  });

  describe('normalizeAbv', () => {
    describe('valid formats', () => {
      it('should extract ABV from simple percentage', () => {
        expect(normalizer.normalizeAbv('45%')).toBe(45);
        expect(normalizer.normalizeAbv('13.5%')).toBe(13.5);
        expect(normalizer.normalizeAbv('40.0%')).toBe(40.0);
      });

      it('should extract ABV with space before percentage', () => {
        expect(normalizer.normalizeAbv('45 %')).toBe(45);
        expect(normalizer.normalizeAbv('13.5 %')).toBe(13.5);
      });

      it('should extract ABV with ABV suffix', () => {
        expect(normalizer.normalizeAbv('45% ABV')).toBe(45);
        expect(normalizer.normalizeAbv('13.5% ABV')).toBe(13.5);
      });

      it('should extract ABV with Alc/Vol suffix', () => {
        expect(normalizer.normalizeAbv('45% Alc/Vol')).toBe(45);
        expect(normalizer.normalizeAbv('40.0% ALC/VOL')).toBe(40.0);
      });

      it('should extract ABV from case-insensitive text', () => {
        expect(normalizer.normalizeAbv('45% abv')).toBe(45);
        expect(normalizer.normalizeAbv('45% ABV')).toBe(45);
        expect(normalizer.normalizeAbv('45% Abv')).toBe(45);
      });

      it('should extract ABV from text with multiple spaces', () => {
        expect(normalizer.normalizeAbv('45  %')).toBe(45);
        expect(normalizer.normalizeAbv('13.5   %')).toBe(13.5);
      });

      it('should handle zero ABV', () => {
        expect(normalizer.normalizeAbv('0%')).toBe(0);
        expect(normalizer.normalizeAbv('0.0%')).toBe(0.0);
      });

      it('should handle 100% ABV', () => {
        expect(normalizer.normalizeAbv('100%')).toBe(100);
        expect(normalizer.normalizeAbv('100.0%')).toBe(100.0);
      });

      it('should handle decimal values', () => {
        expect(normalizer.normalizeAbv('4.5%')).toBe(4.5);
        expect(normalizer.normalizeAbv('45.75%')).toBe(45.75);
        expect(normalizer.normalizeAbv('0.5%')).toBe(0.5);
      });

      it('should extract first percentage value from text with multiple percentages', () => {
        expect(normalizer.normalizeAbv('ABV 45% - Contains 10% sugar')).toBe(45);
      });
    });

    describe('invalid formats', () => {
      it('should return null for text without percentage', () => {
        expect(normalizer.normalizeAbv('45 ABV')).toBeNull();
        expect(normalizer.normalizeAbv('forty-five')).toBeNull();
        expect(normalizer.normalizeAbv('No alcohol')).toBeNull();
      });

      it('should return null for empty or null text', () => {
        expect(normalizer.normalizeAbv('')).toBeNull();
        expect(normalizer.normalizeAbv(null as any)).toBeNull();
        expect(normalizer.normalizeAbv(undefined as any)).toBeNull();
      });

      it('should return null for percentage without number', () => {
        expect(normalizer.normalizeAbv('%')).toBeNull();
        expect(normalizer.normalizeAbv('ABV %')).toBeNull();
      });

      it('should return null for invalid percentage values', () => {
        // Note: normalizer extracts values but doesn't validate ranges
        // Validation is done in the validation layer
        expect(normalizer.normalizeAbv('abc%')).toBeNull(); // non-numeric
      });

      it('should handle percentage with unusual formatting', () => {
        // parseFloat handles double decimals by taking the first valid number
        expect(normalizer.normalizeAbv('45..5%')).toBe(45);
      });
    });

    describe('edge cases', () => {
      it('should handle text with percentage at the beginning', () => {
        expect(normalizer.normalizeAbv('45% is the alcohol content')).toBe(45);
      });

      it('should handle text with percentage at the end', () => {
        expect(normalizer.normalizeAbv('Alcohol content is 45%')).toBe(45);
      });

      it('should handle very small decimal values', () => {
        expect(normalizer.normalizeAbv('0.1%')).toBe(0.1);
        expect(normalizer.normalizeAbv('0.01%')).toBe(0.01);
      });

      it('should handle values close to boundaries', () => {
        expect(normalizer.normalizeAbv('99.9%')).toBe(99.9);
        expect(normalizer.normalizeAbv('0.1%')).toBe(0.1);
      });
    });
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

  describe('combined scenarios', () => {
    it('should handle text with both ABV and volume', () => {
      const text = '750ml, 45% ABV';
      expect(normalizer.normalizeVolume(text)).toBe(750);
      expect(normalizer.normalizeAbv(text)).toBe(45);
    });

    it('should handle complex product descriptions', () => {
      const text = 'Kentucky Straight Bourbon Whiskey - 750ML - 45% ALC/VOL';
      expect(normalizer.normalizeVolume(text)).toBe(750);
      expect(normalizer.normalizeAbv(text)).toBe(45);
    });
  });
});