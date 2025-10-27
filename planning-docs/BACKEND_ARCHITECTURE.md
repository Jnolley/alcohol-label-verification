# Backend Architecture

## Overview

The backend is a stateless Node.js/Express API that performs OCR-based label verification using Google Cloud Vision API.

## System Layers

```
┌─────────────────────────────────────┐
│         API Layer                   │
│   Controllers + Routes              │
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

## Main Endpoints

**POST /api/verify** - Verify label against form data
- Input: Form fields (brandName, productType, alcoholContent) + image file
- Output: Verification result with field-by-field status

**Admin Endpoints** (Basic Auth required):
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/submissions` - List all submissions
- `GET /api/admin/submissions/:id` - Get submission details with OCR bounding boxes
- `PATCH /api/admin/submissions/:id` - Approve/reject submission

## Directory Structure

```
backend/src/
├── api/
│   ├── controllers/        # Request handlers
│   ├── routes/            # Express routes
│   └── middleware/        # Auth, error handling
├── services/
│   ├── manager/           # Business orchestration
│   ├── engine/            # OCR + verification
│   ├── validation/        # Input validation
│   └── utility/           # Image processing, normalization
├── storage/               # In-memory submission store
├── common/                # Shared types & enums
└── config.ts              # Configuration
```

## Core Services

### 1. Verification Manager
Orchestrates the verification workflow:
1. Validates form data and image
2. Calls OCR service to extract text
3. Calls verification service to match fields
4. Auto-saves failed verifications for admin review

### 2. OCR Engine (`services/engine/ocr/`)
- Preprocesses images (resize, grayscale, sharpen)
- Extracts text using Google Cloud Vision API
- Returns text with word-level bounding boxes for visualization

### 3. Verification Engine (`services/engine/verification/`)
- Compares extracted text with form data
- Field-by-field matching:
  - **Brand Name**: Fuzzy matching (90% threshold)
  - **Product Type**: Keyword matching
  - **Alcohol Content**: Exact match (0% tolerance)
  - **Government Warning**: Section-based validation (7 required sections)

### 4. Image Processor (`services/utility/image-processing/`)
- Validates file size (max 10MB) and format (JPEG/PNG/WebP)
- Preprocesses for better OCR accuracy

### 5. Submission Storage (`storage/`)
- In-memory store for failed verifications
- Stores form data, image, OCR results, and verification status
- Statuses: `pending`, `approved`, `rejected`

## Configuration (`config.ts`)

All thresholds and settings are centralized in `backend/src/config.ts`:
- OCR confidence threshold: 30%
- Fuzzy match threshold: 90%
- ABV tolerance: 0% (exact match)
- Brand name word match: 99%
- Admin credentials (default: admin/admin123)

## Environment Variables

**Required:**
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud Vision API credentials (local dev)

**Optional:**
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - CORS origin (default: http://localhost:4200)
- `ADMIN_USERNAME` - Admin username (default: admin)
- `ADMIN_PASSWORD` - Admin password (default: admin123)

---

## Detailed Layer Documentation

Each layer has its own detailed documentation file:

- **[API Layer](../backend/src/api/api.md)** - Controllers, routes, middleware, request flow
- **[Common Types](../backend/src/common/common.md)** - Shared types, enums, and interfaces
- **[Verification Manager](../backend/src/services/manager/label-verification/manager.md)** - Business orchestration and workflow
- **[OCR Service](../backend/src/services/engine/ocr/ocr.md)** - Text extraction with Google Cloud Vision
- **[Verification Service](../backend/src/services/engine/verification/verification.md)** - Label verification logic
- **[Utilities](../backend/src/services/utility/utilities.md)** - Image processing and validation
- **[Validation](../backend/src/services/validation/validation.md)** - Input validation rules
