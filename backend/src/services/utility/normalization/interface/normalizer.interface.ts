export interface INormalizer {
  normalizeAbv(text: string): number | null;
  normalizeVolume(text: string): number | null;
  convertToMilliliters(value: number, unit: string): number;
}