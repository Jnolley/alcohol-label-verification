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
}