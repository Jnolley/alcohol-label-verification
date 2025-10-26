# OCR Text Extraction

Extracts text from label images using Tesseract.

## Flow

```mermaid
sequenceDiagram
    participant Manager
    participant Extractor as TextExtractor
    participant Preprocessor as ImagePreprocessor
    participant Tesseract

    Manager->>Extractor: extract(imageBuffer)

    Extractor->>Preprocessor: preprocessForOCR(imageBuffer)
    Note over Preprocessor: - Resize (min 1000px)<br/>- Grayscale<br/>- Normalize<br/>- Sharpen<br/>- Increase contrast
    Preprocessor->>Extractor: processedBuffer

    Extractor->>Tesseract: createWorker(language)
    Extractor->>Tesseract: setParameters(PSM.SINGLE_BLOCK)
    Extractor->>Tesseract: recognize(processedBuffer)
    Tesseract->>Extractor: {text, confidence}

    Extractor->>Extractor: Validate text extracted
    alt no text or too short
        Extractor-->>Manager: throw HttpError(422)
    end

    Extractor->>Extractor: Check confidence
    alt confidence too low
        Extractor-->>Manager: throw HttpError(422)
    end

    Extractor->>Extractor: normalizeText()
    Note over Extractor: Uppercase, trim, collapse whitespace

    Extractor->>Manager: ExtractedText {raw, normalized, confidence}
```

## Image Preprocessing

Uses Sharp library for:
- Resize to minimum 1000px
- Grayscale conversion
- Contrast normalization
- Edge sharpening (sigma: 1.5)
- Contrast enhancement

## Configuration

From `config.ts`:
- `ocr.language` - Tesseract language
- `ocr.minTextLength` - Minimum extracted text length
- `ocr.minConfidence` - Minimum OCR confidence threshold

## Errors

Returns HTTP 422 for:
- No text extracted
- Insufficient text length
- Low OCR confidence