import { BoundingBox } from './bounding-box';

export interface DetectedWord {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}
