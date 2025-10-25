export interface INormalizer {
  normalizeAbv(text: string): number | null;
  normalizeVolume(text: string): number | null;
}