export interface IImageValidator {
  validate(buffer: Buffer, filename: string): Promise<void>;
}