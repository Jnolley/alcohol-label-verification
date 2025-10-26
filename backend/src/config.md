# Configuration

Centralized application configuration in `config.ts`.

## Structure

All configuration is exported as a single `config` object with nested sections.

## Configuration Sections

### Image Validation

```typescript
image: {
  maxFileSizeMB: 10,
  allowedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
}
```

**maxFileSizeMB**: Maximum upload file size (default: 10MB)
**allowedFormats**: Accepted MIME types for images

Used by: `ImageValidator`

---

### OCR Settings

```typescript
ocr: {
  minConfidence: 30,
  minTextLength: 3,
  language: 'eng'
}
```

**minConfidence**: Minimum OCR confidence % to accept (0-100)
**minTextLength**: Minimum characters extracted
**language**: Tesseract language model

Used by: `TextExtractor`

---

### Verification Tolerances

```typescript
verification: {
  alcoholContentTolerance: 0.0,
  brandNameMinWordMatch: 0.99,
  productTypeMinKeywordMatch: 1,
  governmentWarningMinSections: 7
}
```

**alcoholContentTolerance**: Allowed ABV difference (0.0 = exact match)
**brandNameMinWordMatch**: Min % of brand words to match (99%)
**productTypeMinKeywordMatch**: Min product keywords to match
**governmentWarningMinSections**: Required warning sections (7 = all)

Used by: `LabelVerifier`

---

### Required Texts

```typescript
requiredTexts: {
  governmentWarning: "GOVERNMENT WARNING: ...",
  governmentWarningSections: [
    'GOVERNMENT WARNING',
    'SURGEON GENERAL',
    'WOMEN SHOULD NOT DRINK ALCOHOLIC BEVERAGES DURING PREGNANCY',
    'RISK OF BIRTH DEFECTS',
    'CONSUMPTION OF ALCOHOLIC BEVERAGES IMPAIRS YOUR ABILITY TO DRIVE',
    'OPERATE MACHINERY',
    'MAY CAUSE HEALTH PROBLEMS'
  ]
}
```

**governmentWarning**: Full TTB-required warning text
**governmentWarningSections**: 7 key sections to verify

Used by: `LabelVerifier.verifyGovernmentWarning()`

---

### Server Settings

```typescript
server: {
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200'
}
```

**port**: Server port
**corsOrigin**: CORS allowed origin

Used by: `index.ts`, `app.ts`

## Environment Variables

Override defaults via environment variables:

- `PORT` - Server port
- `CORS_ORIGIN` - CORS allowed origin

## Usage

```typescript
import { config } from './config';

// Access nested values
const maxSize = config.image.maxFileSizeMB;
const language = config.ocr.language;
```

The config object is marked `as const` for type safety.