# Shared Layer

Reusable code shared across features and the entire application.

## Structure

```
shared/
├── components/
│   └── toast-container/       # Global toast notification display
├── constants/
│   └── icons.ts              # SVG icon constants
├── enums/
│   ├── field-type.enum.ts    # Verification field types
│   └── match-status.enum.ts  # Match status values
└── models/
    ├── field-check.model.ts         # Field verification result
    ├── label-form-data.model.ts     # Form submission data
    ├── submission.model.ts          # Admin submission model
    ├── toast.model.ts               # Toast notification model
    ├── verification-request.model.ts # API request payload
    └── verification-result.model.ts  # API response payload
```

## Components

### Toast Container
Renders active toast notifications at the top of the screen.

**Location:** `shared/components/toast-container/`

**Responsibilities:**
- Display all active toasts from ToastService
- Auto-position at top-right of screen
- Handle toast dismissal (auto + manual)
- Apply styling based on toast type

**Styling:**
- Success: Green background
- Error: Red background
- Info: Blue background

---

## Models

### LabelFormData
User-submitted form data for label verification.

```typescript
{
  brandName: string;
  productType: string;
  alcoholContent: number;
  netContentsValue?: number;
  netContentsUnit?: string;
}
```

### VerificationResult
Backend response from verification API.

```typescript
{
  success: boolean;
  message: string;
  fieldChecks: FieldCheck[];
}
```

### FieldCheck
Individual field verification result.

```typescript
{
  fieldType: FieldType;
  status: MatchStatus;
  message: string;
  expected: string;
  found?: string;
}
```

### Submission
Admin submission model with full verification details.

```typescript
{
  id: string;
  formData: LabelFormData;
  imageUrl: string;
  extractedText: string;
  verificationResult: VerificationResult;
  status: SubmissionStatus;
  timestamp: Date;
  ocrWords?: DetectedWord[];
  imageDimensions?: { width: number; height: number };
}
```

### Toast
Toast notification model.

```typescript
{
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
```

### VerificationRequest
API request payload for verification.

```typescript
{
  formData: FormData; // multipart/form-data
}
```

---

## Enums

### FieldType
Fields that can be verified on a label.

```typescript
enum FieldType {
  BRAND_NAME = 'Brand Name',
  PRODUCT_TYPE = 'Product Type',
  ALCOHOL_CONTENT = 'Alcohol Content',
  NET_CONTENTS = 'Net Contents',
  GOVERNMENT_WARNING = 'Government Warning'
}
```

### MatchStatus
Verification match status values.

```typescript
enum MatchStatus {
  MATCH = 'MATCH',
  MISMATCH = 'MISMATCH',
  NOT_FOUND = 'NOT_FOUND'
}
```

---

## Constants

### Icons
SVG icon constants used throughout the app.

**Available Icons:**
- `CHECK_CIRCLE` - Success checkmark (green)
- `X_CIRCLE` - Error/failure X (red)
- `INFO_CIRCLE` - Information icon (blue)

**Usage:**
```typescript
import { ICONS } from '@/app/shared/constants/icons';

// In template
{{ ICONS.CHECK_CIRCLE }}
```

---

## Usage

Import shared resources as needed:

```typescript
// Models
import { LabelFormData } from '@/app/shared/models/label-form-data.model';
import { VerificationResult } from '@/app/shared/models/verification-result.model';

// Enums
import { FieldType } from '@/app/shared/enums/field-type.enum';
import { MatchStatus } from '@/app/shared/enums/match-status.enum';

// Constants
import { ICONS } from '@/app/shared/constants/icons';
```