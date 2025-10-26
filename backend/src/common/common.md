# Common Types

Shared types, enums, and interfaces used across the application.

## Structure

```
common/
├── contracts/            # Type definitions
│   ├── form-data.ts
│   ├── verification-result.ts
│   └── field-check.ts
├── enums/               # Enumerations
│   ├── field-type.enum.ts
│   └── match-status.enum.ts
└── index.ts             # Barrel exports
```

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
OCR extraction output.

```typescript
{
  raw: string
  normalized: string
  confidence: number
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

All types are exported from `common/index.ts`:

```typescript
import { FormData, VerificationResult, FieldType } from './common';
```