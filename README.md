# Alcohol Label Verification System

A web application that uses OCR to verify alcohol labels comply with TTB regulations.

## What It Does

1. User uploads a photo of an alcohol label
2. User enters label details (brand, ABV, etc.)
3. System extracts text from image using OCR
4. System verifies the user's claims match the label
5. If verification fails, admin reviews it manually

## Architecture

### Frontend (`/frontend`)
- **Tech:** Angular 18 + TailwindCSS
- **Pages:**
  - `/` - Label verification form
  - `/admin/login` - Admin login
  - `/admin/dashboard` - View all submissions
  - `/admin/submission/:id` - Review individual submission with OCR annotations

### Backend (`/backend`)
- **Tech:** Node.js + Express + TypeScript
- **APIs:**
  - `POST /api/verify` - Verify label (public)
  - `POST /api/admin/login` - Admin login
  - `GET /api/admin/submissions` - List submissions
  - `GET /api/admin/submissions/:id` - Get submission details
  - `PATCH /api/admin/submissions/:id` - Approve/reject submission

### Services

**OCR Engine** (`backend/src/services/engine/ocr/`)
- Uses Tesseract.js v6 with PSM 11 (sparse text mode) for product labels
- Adaptive thresholding preprocessing for shadow handling
- Extracts word-level bounding boxes for admin visualization

**Verification Engine** (`backend/src/services/engine/verification/`)
- Fuzzy matching for brand names
- Exact ABV matching
- Government warning text validation
- Product type keyword matching

**Storage** (`backend/src/storage/`)
- In-memory submission storage (no database)
- Statuses: `pending`, `auto_approved`, `approved`, `rejected`

## Running Locally

### Backend
```bash
cd backend
npm install
npm run dev  # http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm start  # http://localhost:4200
```

### Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
npm run cypress:open  # E2E tests
```

## Deployment

- **Frontend:** Vercel (auto-deploys from `main`)
- **Backend:** Vercel (auto-deploys from `main`)
- Both configured in `vercel.json` to only deploy from `main` branch

## Key Configuration

**OCR Settings** (`backend/src/config.ts`)
- PSM Mode: 11 (sparse text for labels)
- Min confidence: 30%
- Language: English

**Verification Thresholds** (`backend/src/config.ts`)
- Fuzzy match: 90%
- ABV tolerance: 0% (exact match)
- Brand name word match: 99%

## Admin Credentials
- Username: `admin` (configurable via `ADMIN_USERNAME`)
- Password: `admin123` (configurable via `ADMIN_PASSWORD`)