# Technology Stack - TTB Label Verification App

**Deployment:** Vercel (serverless functions)

---

## Frontend Stack

### Core
- **Angular 19** (v19.2.15) with TypeScript 5.8
- **TailwindCSS** (v3.4.18) for styling
- **@ngrx/signals** (v19.2.1) for state management
- **RxJS** (v7.8) for reactive programming
- Standalone components architecture
- Canvas API for image annotations

### Testing
- **Jasmine** with **Karma** for unit tests
- **Cypress** (v15.5.0) for E2E tests

---

## Backend Stack

### Core Runtime
- **Node.js 18+** with TypeScript 5.9
- **Express.js** (v5.1.0) for REST API
- **Jest** (v30.2.0) for testing

### OCR & Image Processing
- **Google Cloud Vision API** (v5.3.4) for text extraction
  - CONFIGURABLE: Implements ITextExtractor interface for easy swapping
- **Sharp** (v0.34.4) for image preprocessing
  - Resizing, format conversion, contrast normalization
  - All thresholds configurable in config.ts

### Text Matching & Validation
- **Fuzzball** (v2.2.3) for fuzzy string matching
  - Levenshtein distance algorithm
  - Handles OCR errors and variations
- **http-errors** (v2.0.0) for consistent error responses

### File Handling
- **Multer** (v2.0.2) for multipart/form-data uploads
- **file-type** (v16.5.4) for magic byte detection

---

## Configurable Settings

All settings in `backend/src/config.ts`:

### Verification Thresholds
```typescript
verification: {
  fuzzyMatchThreshold: 90,        // TUNABLE: 0-100
  fuzzyMatchMinLength: 0.5,       // TUNABLE: 0-1
  bestMatchThreshold: 70,         // TUNABLE: 0-100
  keywordMatchThreshold: 0.8,     // TUNABLE: 0-1
  alcoholContentTolerance: 0.0,   // TUNABLE: ABV tolerance
  brandNameMinWordMatch: 0.99,    // TUNABLE: 0-1
  governmentWarningMinSections: 7 // TUNABLE: max 7
}
```

### OCR Settings
```typescript
ocr: {
  minConfidence: 30,              // TUNABLE: 0-100
  minTextLength: 3,               // TUNABLE: min characters
  language: 'eng'                 // TUNABLE: language code
}
```

### Image Processing
```typescript
image: {
  maxFileSizeMB: 10,              // TUNABLE: upload limit
  maxFileSizeBytes: 10485760,     // TUNABLE: bytes
  minDimensionForOCR: 1000,       // TUNABLE: upscale threshold
  allowedFormats: [...]           // TUNABLE: MIME types
}
```

### Environment Variables
```typescript
server: {
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN
}

admin: {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123'
}
```

---

## Swappable Implementations

### OCR Engine (ITextExtractor)
**Current:** Google Cloud Vision API

**Interface:**
```typescript
export interface ITextExtractor {
  extract(buffer: Buffer): Promise<ExtractedText>;
}
```

**Alternatives:** Tesseract.js, AWS Textract, Azure Computer Vision

### Storage (ISubmissionStore)
**Current:** In-memory array

**Interface:**
```typescript
export interface ISubmissionStore {
  add(...): Submission;
  getAll(status?: SubmissionStatus): Submission[];
  getById(id: string): Submission | undefined;
  updateStatus(...): Submission | undefined;
}
```

**Alternatives:** PostgreSQL, MongoDB, SQLite, Redis

### Text Normalizer (INormalizer)
**Current:** Simple normalization

**Interface:**
```typescript
export interface INormalizer {
  normalizeVolume(text: string): number | null;
}
```

**Can be extended:** Stemming, abbreviation expansion, synonyms

---

## Architecture Patterns

### Backend
- Layered architecture (API → Manager → Service → Storage)
- Interface-based dependency injection
- Repository pattern
- Strategy pattern (verification matching)
- Pipeline pattern (image preprocessing)

### Frontend
- Feature-based structure
- Smart/dumb component separation
- Service layer for API communication
- Reactive state with Signals

---

## Why These Choices

**Google Cloud Vision over Tesseract:**
- Higher accuracy (95% vs 70-80%)
- Word-level bounding boxes included
- No training required

**In-Memory Storage:**
- Per requirements (no persistence needed)
- Zero configuration
- Simple deployment

**Angular over React:**
- Opinionated (less decision fatigue)
- TypeScript native
- Enterprise-ready

**Express over NestJS:**
- Lightweight
- Sufficient for needs
- Well-understood

**Jest over Others:**
- Zero-config TypeScript
- Built-in mocking and coverage
- Most widely adopted

---

## Verified Test Coverage

**Backend Tests:** 173 passing tests
- Controllers: Verification, Admin
- Services: OCR, Verification, Validation, Normalization
- Utilities: Image processing, validation
- Integration: End-to-end flows
