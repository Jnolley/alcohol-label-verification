import { ExtractedText } from '../contracts/extracted-text';

export interface ITextExtractor {
  extract(buffer: Buffer): Promise<ExtractedText>;
  extractFromMultiple(buffers: Buffer[]): Promise<ExtractedText>;
}