# Verification Manager

Orchestrates the entire label verification process.

## Flow

```mermaid
sequenceDiagram
    participant Controller
    participant Manager as VerificationManager
    participant FieldVal as FieldValidator
    participant ImgVal as ImageValidator
    participant OCR as TextExtractor
    participant Verifier as LabelVerifier

    Controller->>Manager: processVerification(formData, imageBuffer, filename)

    Manager->>FieldVal: validate(formData)
    alt validation fails
        FieldVal-->>Manager: throw HttpError(400)
    end

    Manager->>ImgVal: validate(imageBuffer, filename)
    alt validation fails
        ImgVal-->>Manager: throw HttpError(422)
    end

    Manager->>OCR: extract(imageBuffer)
    alt OCR fails
        OCR-->>Manager: throw HttpError(422)
    end
    OCR->>Manager: ExtractedText

    Manager->>Verifier: verify(formData, extractedText)
    Verifier->>Manager: VerificationResult

    Manager->>Controller: VerificationResult
```

## Initialization

Dependencies are injected in order:
1. FieldValidator
2. ImageValidator
3. TextExtractor
4. LabelVerifier
5. ConsoleLogger

See app.ts for dependency wiring.

## Processing Steps

1. **Field Validation** - See [validation.md](../../validation/validation.md)
2. **Image Validation** - See [utilities.md](../../utility/utilities.md)
3. **Text Extraction** - See [ocr.md](../../engine/ocr/ocr.md)
4. **Label Verification** - See [verification.md](../../engine/verification/verification.md)