# Common Types

Shared types, enums, and interfaces used across the application.

## Structure

```
common/
├── contracts/            # Type definitions (one interface per file)
│   ├── form-data.ts
│   ├── verification-result.ts
│   └── field-check.ts
└── enums/               # Enumerations
    ├── field-type.ts
    └── match-status.ts
```

**Note**: Each contract is in its own file following single-responsibility principle.

## Core Types

### FormData
User-submitted form data for verification.

```typescript
{
  brandName: string
  productType: string
  alcoholContent: number
  netContentsValue?: number
  netContentsUnit?: string
}
```

### VerificationResult
Result of label verification process.

```typescript
{
  success: boolean
  message: string
  fieldChecks: FieldCheck[]
}
```

### FieldCheck
Individual field verification result.

```typescript
{
  fieldType: FieldType
  status: MatchStatus
  message: string
  expected: string
  found?: string
}
```

### ExtractedText
OCR extraction output (defined in `services/engine/ocr/contracts/`).

```typescript
{
  raw: string
  normalized: string
  confidence: number
  words: DetectedWord[]
  imageDimensions?: {
    original: { width: number; height: number }
    processed: { width: number; height: number }
  }
  processedImageBuffer?: Buffer
}
```

### DetectedWord
Individual word detected by OCR (defined in `services/engine/ocr/contracts/`).

```typescript
{
  text: string
  bbox: BoundingBox
  confidence: number
}
```

### BoundingBox
Coordinates for detected text (defined in `services/engine/ocr/contracts/`).

```typescript
{
  x: number
  y: number
  width: number
  height: number
}
```

## Enums

### FieldType
Fields that can be verified:
- `BRAND_NAME`
- `PRODUCT_TYPE`
- `ALCOHOL_CONTENT`
- `NET_CONTENTS`
- `GOVERNMENT_WARNING`

### MatchStatus
Verification statuses:
- `MATCH` - Field matches label
- `MISMATCH` - Field doesn't match label
- `NOT_FOUND` - Field not found on label

## Usage

Types are imported directly from their source files:

```typescript
import { FormData } from './common/contracts/form-data';
import { VerificationResult } from './common/contracts/verification-result';
import { FieldCheck } from './common/contracts/field-check';
import { FieldType } from './common/enums/field-type';
import { MatchStatus } from './common/enums/match-status';
```