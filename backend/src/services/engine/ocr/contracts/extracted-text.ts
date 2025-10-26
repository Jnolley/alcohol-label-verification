export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedWord {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface ExtractedText {
  raw: string;
  normalized: string;
  confidence: number;
  words: DetectedWord[];
  imageDimensions?: {
    original: { width: number; height: number };
    processed: { width: number; height: number };
  };
  processedImageBuffer?: Buffer; // The preprocessed image that OCR actually processed
}