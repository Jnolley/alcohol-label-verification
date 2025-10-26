# Backend Architecture

TTB Label Verification System - High-level architecture overview.

## Directory Structure

```
src/
├── api/                    # HTTP layer
│   ├── controllers/        # Request handlers
│   └── routes/            # Express routes
├── services/
│   ├── manager/           # Business orchestration
│   │   └── label-verification/
│   │       └── manager.md
│   ├── engine/            # Core processing
│   │   ├── ocr/
│   │   │   └── ocr.md
│   │   └── verification/
│   │       └── verification.md
│   ├── validation/        # Input validation
│   │   └── validation.md
│   └── utility/           # Cross-cutting services
│       └── utilities.md
├── common/                # Shared types
└── config/                # Configuration
```

## System Layers

```
┌─────────────────────────────────────┐
│         API Layer                   │
│   Controllers + Express Routes      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Manager Layer                 │
│   Business Orchestration            │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Engine Layer                  │
│   OCR + Verification Logic          │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Utility Layer                 │
│   Validation + Preprocessing        │
└─────────────────────────────────────┘
```

## Main Endpoint

**POST /api/verify** - Verify label against form data

**Input**:
- Form fields: brandName, productType, alcoholContent, netContents (optional)
- File upload: Label image (JPEG, PNG, or WebP)

**Output**:
```json
{
  "success": true,
  "message": "Label matches form data",
  "fieldChecks": [
    {
      "fieldType": "BRAND_NAME",
      "status": "MATCH",
      "message": "Brand name found on label",
      "expected": "Old Tom Distillery",
      "found": "Old Tom Distillery"
    }
  ]
}
```

## Request Flow

1. **API Layer** receives multipart/form-data
2. **Manager** coordinates verification:
   - Field validation
   - Image validation
   - OCR extraction
   - Label verification
3. **Response** sent to client

## Detailed Documentation

### Core Layers
- [API Layer](./api/api.md) - Controllers, routes, and HTTP interface
- [Manager Layer](./services/manager/label-verification/manager.md) - Request orchestration
- [Validation](./services/validation/validation.md) - Form field validation
- [OCR Engine](./services/engine/ocr/ocr.md) - Text extraction
- [Verification Engine](./services/engine/verification/verification.md) - Label matching
- [Utilities](./services/utility/utilities.md) - Image processing, normalization, logging

### Supporting
- [Common Types](./common/common.md) - Shared types and enums
- [Configuration](./config.md) - Application settings and environment variables

## Configuration

See `config.ts` for:
- OCR settings (language, thresholds)
- Image constraints (size, formats)
- Verification tolerances
- Required warning text

## Error Handling

- **400** - Invalid form data
- **401** - Unauthorized (admin authentication failed)
- **422** - Invalid image or OCR failure
- **500** - Internal server error

All errors return:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

# Admin System Architecture

## Overview

The admin system provides manual review capabilities for label verifications that fail automatic validation. When a verification fails, the submission is automatically saved to an in-memory store with OCR bounding box data, allowing admins to visually inspect what the AI detected and approve or reject submissions.

## Directory Structure

```
src/
├── storage/                    # NEW: Submission storage
│   ├── contracts/
│   │   └── submission.ts       # Submission model & status enum
│   └── implementation/
│       └── submission.store.ts # In-memory submission storage
├── api/
│   ├── controllers/
│   │   ├── verification.controller.ts  # UPDATED: Auto-saves failed verifications
│   │   └── admin.controller.ts         # NEW: Admin endpoints
│   ├── routes/
│   │   └── admin.routes.ts              # NEW: Admin routes
│   └── middleware/
│       └── admin-auth.middleware.ts     # NEW: Basic auth for admin
└── config.ts                    # UPDATED: Admin credentials
```

## Admin API Endpoints

**POST /api/admin/login** - Authenticate admin user
- Auth: Basic Auth (username/password in header or body)
- Returns: `{ success: true, message: "Login successful" }`

**GET /api/admin/submissions** - List all submissions
- Auth: Basic Auth required
- Query params: `status` (optional: pending|approved|rejected)
- Returns: `{ success: true, count: N, submissions: [...] }`

**GET /api/admin/submissions/:id** - Get submission details
- Auth: Basic Auth required
- Returns: `{ success: true, submission: {...} }` with OCR bounding boxes

**PATCH /api/admin/submissions/:id** - Update submission status
- Auth: Basic Auth required
- Body: `{ status: "approved|rejected", adminNotes?: string, reviewedBy?: string }`
- Returns: `{ success: true, submission: {...} }`

## Authentication

Simple hardcoded credentials stored in `config.ts`:
- Username: `admin` (or `process.env.ADMIN_USERNAME`)
- Password: `admin123` (or `process.env.ADMIN_PASSWORD`)

Uses HTTP Basic Authentication - credentials sent as base64-encoded `Authorization: Basic` header.

## Data Model

### Submission
```typescript
interface Submission {
  id: string;                           // e.g. "SUB-1"
  formData: FormData;                   // User's form input
  imageBase64: string;                  // Uploaded label image
  ocrData: ExtractedText;               // OCR results WITH bounding boxes
  verificationResult: VerificationResult; // Field check results
  status: SubmissionStatus;             // pending | approved | rejected
  timestamp: Date;                      // When submitted
  adminNotes?: string;                  // Admin review notes
  reviewedAt?: Date;                    // When reviewed
  reviewedBy?: string;                  // Who reviewed it
}
```

### ExtractedText (Enhanced with Bounding Boxes)
```typescript
interface ExtractedText {
  raw: string;           // Raw OCR text
  normalized: string;    // Normalized text
  confidence: number;    // Overall confidence
  words: DetectedWord[]; // NEW: Word-level bounding boxes
}

interface DetectedWord {
  text: string;
  bbox: {
    x: number;          // Pixel coordinates
    y: number;
    width: number;
    height: number;
  };
  confidence: number;   // Per-word confidence
}
```

---

## Flow Diagrams

### 1. Admin Login Flow

```mermaid
sequenceDiagram
    participant User as Admin User
    participant Frontend as Angular App
    participant AuthService
    participant Backend as Express API
    participant Middleware as adminAuthMiddleware
    participant Config

    User->>Frontend: Enter username/password
    Frontend->>Frontend: Create Basic Auth header
    Frontend->>Backend: POST /api/admin/login<br/>(Authorization: Basic base64)

    Backend->>Middleware: Check credentials
    Middleware->>Config: Get admin.username & admin.password
    Config-->>Middleware: Return credentials

    alt Valid Credentials
        Middleware->>Backend: next()
        Backend-->>Frontend: 200 OK { success: true }
        Frontend->>AuthService: login(username, password)
        AuthService->>AuthService: Store credentials in localStorage
        AuthService->>AuthService: Set isAuthenticated = true
        Frontend->>Frontend: Navigate to /admin/dashboard
    else Invalid Credentials
        Middleware-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Display error message
    end
```

### 2. Auto-Save Failed Verification Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Angular App
    participant Backend as VerificationController
    participant Manager as VerificationManager
    participant OCR as TextExtractor
    participant Verifier as LabelVerifier
    participant Store as SubmissionStore

    User->>Frontend: Submit form + image
    Frontend->>Backend: POST /api/verify<br/>(multipart/form-data)

    Backend->>Manager: processVerificationExtended()
    Note over Manager: Includes OCR data in response

    Manager->>OCR: extract(imageBuffer)
    OCR->>OCR: Tesseract.recognize()
    OCR->>OCR: Extract word bounding boxes<br/>(x, y, width, height)
    OCR-->>Manager: ExtractedText with words[]

    Manager->>Verifier: verify(formData, extractedText)
    Verifier->>Verifier: Check each field<br/>(brand, type, ABV, etc.)
    Verifier-->>Manager: VerificationResult

    Manager-->>Backend: { result, ocrData }

    alt Verification Failed (!result.success)
        Backend->>Backend: Convert image to base64
        Backend->>Store: add(formData, imageBase64, ocrData, result)
        Store->>Store: Create Submission<br/>(status: PENDING, id: "SUB-N")
        Store-->>Backend: Return submission

        Backend-->>Frontend: 200 OK {<br/>  success: false,<br/>  underReview: true,<br/>  message: "Under admin review"<br/>}
        Frontend->>Frontend: Show yellow warning:<br/>"Your submission is being reviewed"
    else Verification Passed
        Backend-->>Frontend: 200 OK {<br/>  success: true,<br/>  underReview: false<br/>}
        Frontend->>Frontend: Show green success
    end
```

### 3. Admin Dashboard Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant Dashboard as DashboardComponent
    participant AdminService
    participant Backend as AdminController
    participant Store as SubmissionStore
    participant Middleware as adminAuthMiddleware

    Admin->>Dashboard: Navigate to /admin/dashboard
    Dashboard->>Dashboard: AdminGuard checks isAuthenticated

    Dashboard->>AdminService: getSubmissions()
    AdminService->>AdminService: Get credentials from localStorage
    AdminService->>Backend: GET /api/admin/submissions<br/>(Authorization: Basic)

    Backend->>Middleware: Validate credentials
    Middleware->>Backend: next()

    Backend->>Store: getAll()
    Store-->>Backend: submissions[]
    Backend->>Backend: Sort by timestamp (newest first)
    Backend-->>AdminService: { success: true, submissions: [...] }

    AdminService-->>Dashboard: submissions
    Dashboard->>Dashboard: Apply filter (all/pending/approved/rejected)
    Dashboard->>Dashboard: Render table with status badges

    Admin->>Dashboard: Click "Review →"
    Dashboard->>Dashboard: Navigate to /admin/submissions/:id
```

### 4. Submission Review Flow (with Image Annotation)

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant Detail as SubmissionDetailComponent
    participant Annotator as ImageAnnotatorComponent
    participant AdminService
    participant Backend as AdminController
    participant Store as SubmissionStore

    Admin->>Detail: Navigate to /admin/submissions/:id
    Detail->>AdminService: getSubmission(id)
    AdminService->>Backend: GET /api/admin/submissions/:id
    Backend->>Store: getById(id)
    Store-->>Backend: submission with OCR data
    Backend-->>AdminService: { success: true, submission: {...} }
    AdminService-->>Detail: submission

    Detail->>Detail: Display form data (left panel)
    Detail->>Annotator: Pass imageBase64 + ocrData.words

    Annotator->>Annotator: Load image on canvas
    Annotator->>Annotator: Calculate scale factor

    loop For each word in ocrData.words
        Annotator->>Annotator: Determine color based on field match<br/>- Green: matched field<br/>- Yellow: partial match<br/>- Red: not found
        Annotator->>Annotator: Draw rectangle at (x, y, width, height)
        Annotator->>Annotator: Store word data for hover detection
    end

    Admin->>Annotator: Hover over bounding box
    Annotator->>Annotator: Detect mouse position
    Annotator->>Annotator: Find word at coordinates
    Annotator->>Annotator: Show tooltip:<br/>"Detected: 'BOURBON' (94% confidence)"

    Detail->>Detail: Display verification results (bottom panel)
    Detail->>Detail: Show approve/reject buttons

    Admin->>Detail: Click "Approve" or "Reject"
    Admin->>Detail: Enter admin notes (optional)
    Detail->>AdminService: updateSubmission(id, status, notes)

    AdminService->>Backend: PATCH /api/admin/submissions/:id<br/>{ status: "approved", adminNotes: "..." }
    Backend->>Store: updateStatus(id, status, notes)
    Store->>Store: Update submission<br/>Set reviewedAt, reviewedBy
    Store-->>Backend: Updated submission
    Backend-->>AdminService: { success: true }
    AdminService-->>Detail: Success

    Detail->>Detail: Show success message
    Detail->>Detail: Navigate back to dashboard
```

### 5. OCR Bounding Box Extraction

```mermaid
sequenceDiagram
    participant Manager as VerificationManager
    participant Extractor as TextExtractor
    participant Preprocessor as ImagePreprocessor
    participant Tesseract as Tesseract.js
    participant Sharp

    Manager->>Extractor: extract(imageBuffer)
    Extractor->>Preprocessor: preprocessForOCR(imageBuffer)

    Preprocessor->>Sharp: Resize, grayscale, normalize, sharpen
    Sharp-->>Preprocessor: processedBuffer
    Preprocessor-->>Extractor: processedBuffer

    Extractor->>Tesseract: createWorker('eng')
    Extractor->>Tesseract: recognize(processedBuffer)

    Tesseract->>Tesseract: Perform OCR
    Tesseract-->>Extractor: data.words[]

    Note over Extractor: Each word contains:<br/>- text: string<br/>- bbox: {x0, y0, x1, y1}<br/>- confidence: number

    Extractor->>Extractor: Map words to DetectedWord[]

    loop For each word in data.words
        Extractor->>Extractor: Extract bbox coordinates:<br/>x = bbox.x0<br/>y = bbox.y0<br/>width = bbox.x1 - bbox.x0<br/>height = bbox.y1 - bbox.y0
    end

    Extractor-->>Manager: ExtractedText {<br/>  raw, normalized, confidence,<br/>  words: DetectedWord[]<br/>}
```

### 6. Image Annotator Rendering

```mermaid
sequenceDiagram
    participant Component as SubmissionDetailComponent
    participant Annotator as ImageAnnotatorComponent
    participant Canvas as HTML Canvas
    participant FieldMatcher as Field Matching Logic

    Component->>Annotator: @Input() imageBase64
    Component->>Annotator: @Input() ocrData
    Component->>Annotator: @Input() verificationResult

    Annotator->>Canvas: Create canvas element
    Annotator->>Canvas: Load image from base64

    Canvas-->>Annotator: onImageLoad()

    Annotator->>Annotator: Calculate scale:<br/>canvasWidth / imageWidth

    Annotator->>FieldMatcher: Map OCR words to field checks
    Note over FieldMatcher: Determine which words match which fields<br/>based on text content and verification results

    loop For each DetectedWord
        Annotator->>FieldMatcher: getFieldForWord(word.text)
        FieldMatcher-->>Annotator: fieldType or null

        alt Word matched a field
            Annotator->>Annotator: Get field check status

            alt Status = MATCH
                Annotator->>Annotator: color = green (#10b981)
            else Status = MISMATCH
                Annotator->>Annotator: color = red (#ef4444)
            else Status = NOT_FOUND
                Annotator->>Annotator: color = red (#ef4444)
            end
        else Word not matched
            Annotator->>Annotator: color = gray (semi-transparent)
        end

        Annotator->>Canvas: Draw rectangle:<br/>ctx.strokeRect(<br/>  x * scale,<br/>  y * scale,<br/>  width * scale,<br/>  height * scale<br/>)
        Annotator->>Canvas: Set lineWidth, strokeStyle
    end

    Annotator->>Annotator: Add hover event listener

    Note over Annotator: User hovers over image

    Annotator->>Annotator: Get mouse coordinates
    Annotator->>Annotator: Find word at position

    alt Word found at position
        Annotator->>Annotator: Show tooltip:<br/>"Detected: 'BOURBON'<br/>Confidence: 94%<br/>Field: Product Type"
    end

    Annotator->>Annotator: Add toggle button
    Note over Annotator: User can show/hide annotations
```

## Storage Layer

### SubmissionStore (In-Memory)

```typescript
class SubmissionStore {
  private submissions: Submission[] = [];
  private idCounter: number = 1;

  add(formData, imageBase64, ocrData, verificationResult): Submission
  getAll(status?: SubmissionStatus): Submission[]
  getById(id: string): Submission | undefined
  updateStatus(id, status, adminNotes?, reviewedBy?): Submission | undefined
  getCount(status?: SubmissionStatus): number
}
```

**Note:** Current implementation uses in-memory storage. Submissions are lost on server restart. For production, this should be replaced with a database (PostgreSQL, MongoDB, etc.).

## Configuration Updates

### config.ts - Admin Section

```typescript
admin: {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
}
```

## Security Considerations

1. **Credentials Storage:** Admin credentials are hardcoded in config for MVP. In production:
   - Use environment variables
   - Hash passwords with bcrypt
   - Consider JWT tokens instead of Basic Auth

2. **CORS:** Admin endpoints should have stricter CORS policies in production

3. **Rate Limiting:** Add rate limiting to prevent brute force attacks on login

4. **Session Management:** Current implementation stores credentials in localStorage. Consider:
   - HTTP-only cookies
   - Short-lived JWT tokens
   - Refresh token rotation

## Future Enhancements

1. **Persistent Storage:** Replace in-memory store with database
2. **Multi-User Admin:** Support multiple admin users with different permissions
3. **Audit Logging:** Track all admin actions
4. **Real-time Updates:** WebSocket notifications when new submissions arrive
5. **Batch Operations:** Approve/reject multiple submissions at once
6. **Advanced Filtering:** Search by brand, date range, OCR confidence
7. **Export Functionality:** Download submissions as CSV/PDF reports
