export interface INormalizer {
  normalizeVolume(text: string): number | null;
  convertToMilliliters(value: number, unit: string): number;
}