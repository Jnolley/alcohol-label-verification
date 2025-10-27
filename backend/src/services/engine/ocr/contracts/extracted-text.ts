import { DetectedWord } from './detected-word';

export interface ExtractedText {
  raw: string;
  normalized: string;
  confidence: number;
  words: DetectedWord[];
  imageDimensions?: {
    original: { width: number; height: number };
    processed: { width: number; height: number };
  };
  processedImageBuffer?: Buffer; // The preprocessed image that OCR actually processed (single image)
  processedImageBuffers?: Buffer[]; // The preprocessed images for multi-image OCR
}