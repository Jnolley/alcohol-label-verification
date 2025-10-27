# Alcohol Label Verification System

 A full-stack web application that simulates the TTB (Alcohol and Tobacco Tax and Trade Bureau) label approval process using AI-powered OCR.

## Overview

Users upload alcohol label images and submit product information through a web form. The system uses Google Cloud Vision API to extract text from the label and automatically verify it matches the submitted data. Failed verifications are saved for admin review with visual OCR annotations showing detected text bounding boxes.

---

**📋 FOR EVALUATORS:** See [submission-docs/](submission-docs/) for complete project documentation:
- **[Requirements List](submission-docs/REQUIREMENTS_LIST.md)** - All requirements met ✓
- **[Bonus Features](submission-docs/BONUS_FEATURES.md)** - 7 additional features beyond requirements
- **[Design Decisions](submission-docs/DESIGN_DECISIONS.md)** - Architectural choices and rationale

---

## Tech Stack

**Frontend:** Angular 19 + TailwindCSS + TypeScript
**Backend:** Node.js + Express + TypeScript
**OCR:** Google Cloud Vision API (Document Text Detection)
**Image Processing:** Sharp
**Text Matching:** Fuzzball (Levenshtein distance)
**Testing:** Jest (173 automated tests)
**Deployment:** Vercel (serverless functions)

## Key Features

### Core Verification
- **Automated OCR** - Extracts text from label images
- **Field-by-Field Validation** - Compares extracted text with form data:
  - Brand Name (fuzzy matching, 90% threshold, word boundary detection)
  - Product Type (keyword matching, 80% threshold)
  - Alcohol Content (exact percentage match)
  - Net Contents (optional, volume + unit verification)
  - Government Warning (validates 7 required sections)

### Advanced Features
- **Image Preprocessing** - Automatic resizing, alpha flattening, contrast normalization
- **Fuzzy Matching** - Handles OCR errors (0/O, 1/l/I, missing punctuation)
- **Visual Annotations** - Admin can see bounding boxes around detected text
- **Admin Review System** - Failed verifications saved for manual review
- **Real-time Results** - Instant feedback with color-coded status
- **In-Memory Storage** - No database required

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Google Cloud Vision API credentials (see setup below)

### Google Cloud Vision API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable "Cloud Vision API" in APIs & Services
4. Create a Service Account:
   - Navigate to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Grant "Cloud Vision API User" role
5. Create JSON Key:
   - Click on the service account
   - Keys tab > Add Key > Create new key > JSON
   - Download the JSON file (e.g., `my-project-vision-api-key.json`)
   - **Save this file** - You'll need it in the next step

**Note for Evaluators**: If you need credentials to test this application, please request them separately or use your own Google Cloud account (free tier includes 1,000 Vision API requests/month).

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

**Configure Google Cloud credentials in `backend/.env`:**

1. **Move the downloaded JSON file to the backend directory:**
   ```bash
   mv ~/Downloads/my-project-12345-abcdef.json ./backend/google-credentials.json
   ```

2. **Edit `backend/.env`** and add the path (relative or absolute):
   ```bash
   # Relative path (from backend directory)
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

   # OR absolute path
   # GOOGLE_APPLICATION_CREDENTIALS=/Users/yourname/project/backend/google-credentials.json
   ```

   **Note:** The file is already in `.gitignore` - it won't be committed to the repository.

**Start the backend:**
```bash
npm run dev  # Development mode on http://localhost:3000
# OR
npm run build && npm start  # Production build
```

### Frontend Setup

```bash
cd frontend
npm install
npm start  # Starts on http://localhost:4200
```

The frontend will automatically connect to the backend at `http://localhost:3000`.

### Quick Start Scripts (Alternative Method)

**For convenience, use the provided scripts to run both frontend and backend together:**

**Mac/Linux:**
```bash
chmod +x dev.sh  # Make executable (first time only)
./dev.sh
```

**Windows:**
```bash
dev.bat
```

These scripts will:
1. Check if Node.js is installed
2. Install dependencies for both frontend and backend (only if `node_modules` doesn't exist)
3. Start the backend server on `http://localhost:3000`
4. Start the frontend server on `http://localhost:4200`
5. Run both concurrently (Mac/Linux in same terminal, Windows in separate windows)
6. Press Ctrl+C to stop both servers (Mac/Linux) or close the terminal windows (Windows)

### Accessing the Application

**Local Development:**
- **Main App**: http://localhost:4200
- **Admin Dashboard**: http://localhost:4200/admin/login (credentials: `admin` / `admin123`)

**Production Deployment:**
- **Main App**: https://frontend-kappa-rosy-28.vercel.app
- **Admin Dashboard**: https://frontend-kappa-rosy-28.vercel.app/admin/login
- **Backend API**: https://backend-eight-mauve-22.vercel.app/api

## How to Use

### Submitting a Label for Verification

1. Open your browser to `http://localhost:4200`
2. Fill out the verification form:
   - **Brand Name**: Enter the exact brand name shown on the label (e.g., "Jack Daniel's")
   - **Product Type**: Enter the type of alcohol (e.g., "Bourbon Whiskey", "Red Wine", "IPA Beer")
   - **Alcohol Content**: Enter the ABV percentage (e.g., "40" for 40% ABV)
   - **Net Contents** (optional): Enter volume and select unit (e.g., "750" ml)
3. Upload a clear image of the label (JPEG, PNG, WEBP, max 10MB)
4. Click "Verify Label"
5. View results:
   - **Green checkmarks** = Field verified successfully
   - **Red X marks** = Field failed verification
   - **Overall status**: APPROVED (all fields passed) or PENDING (needs admin review)

### Admin Review Dashboard

1. Navigate to `http://localhost:4200/admin`
2. Login with credentials:
   - Username: `admin`
   - Password: `admin123`
3. View all submissions with filters (All, Pending, Approved, Rejected)
4. Click on any submission to see:
   - Original label image with OCR bounding boxes
   - Extracted text from the image
   - Field-by-field verification results
   - Form data submitted by user
5. Manually approve or reject submissions
6. Update submission status

### Building for Production

**Backend:**
```bash
cd backend
npm run build    # Compiles TypeScript to JavaScript in dist/
npm start        # Runs the production build
```

**Frontend:**
```bash
cd frontend
npm run build    # Builds production bundle in dist/
```

The production build can be deployed to:
- **Backend**: Vercel (serverless functions)
- **Frontend**: Vercel (static site hosting)

See `backend/vercel.json` and `frontend/vercel.json` for deployment configurations.

## Project Structure

```
/backend/src/
  ├── api/              # Controllers, routes, middleware
  ├── services/         # Business logic (OCR, verification)
  ├── storage/          # In-memory submission store
  └── config.ts         # Configuration & thresholds

/frontend/src/app/
  ├── core/             # Services (API, auth, toast)
  ├── features/
  │   ├── label-verification/   # Main verification form
  │   └── admin/               # Admin dashboard & review
  └── shared/           # Models, types, components

/docs/                  # Architecture & technical documentation
```

## Documentation

- [Backend Architecture](planning-docs/BACKEND_ARCHITECTURE.md)
- [Frontend Architecture](planning-docs/FRONTEND_ARCHITECTURE.md)
- [Testing Strategy](planning-docs/TESTING_STRATEGY.md)

## Configuration

All verification thresholds are in `backend/src/config.ts`:
- OCR confidence: 30%
- Fuzzy match: 90%
- ABV tolerance: 0% (exact match)
- Brand word match: 99%

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`

(Override via `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables)

## OCR & AI Tools Used

### Google Cloud Vision API (Document Text Detection)
- **Purpose**: Primary OCR engine for text extraction from label images
- **Why Chosen**: Superior accuracy (95%+ on clear images vs 70-80% for Tesseract), provides word-level bounding boxes, handles varied fonts and layouts, no training required
- **Features Used**:
  - Document text detection API (optimized for structured documents)
  - Word-level confidence scores
  - Bounding box coordinates for visual annotations

### Sharp (Image Preprocessing)
- **Purpose**: Prepare images for optimal OCR results
- **Processing Pipeline**:
  - Resize small images to minimum 1000px (maintains aspect ratio)
  - Flatten transparent backgrounds to white
  - Normalize contrast using histogram spreading
  - Output as uncompressed PNG for consistency

### Fuzzball (Fuzzy String Matching)
- **Purpose**: Handle OCR errors and text variations
- **Algorithm**: Levenshtein distance-based similarity scoring
- **Use Cases**: Brand names with special characters, OCR misreads (0 vs O, 1 vs l vs I), missing punctuation

## Assumptions

1. **Image Quality**: Labels are photographed clearly with good lighting and minimal glare
2. **Text Readability**: Text on labels are readable
3. **Language**: All labels are in English
4. **Label Format**: Standard TTB-compliant label format (not highly decorative/artistic)
5. **Government Warning**: Exact TTB warning text is used (not paraphrased or abbreviated)
6. **Net Contents**: Uses standard units (ml, cl, L, fl oz, gal) without automatic conversion
7. **Alcohol Content**: Displayed as percentage with "%" symbol or "Alc./Vol." notation
8. **Case Insensitivity**: Verification ignores case differences (BOURBON matches bourbon)
9. **Punctuation Tolerance**: Minor punctuation differences are ignored (Jack Daniels matches Jack Daniel's)
10. **Single Label**: Each submission contains one label image (front face only)

## Limitations

### Technical Limitations
1. **OCR Accuracy**:
   - Depends heavily on image quality (blurry, low-light, or angled photos may fail)
   - Decorative/stylized fonts may not be recognized accurately
   - Minimum 30% confidence threshold required (lower confidence rejected)

2. **Text Matching**:
   - Government warning must match TTB-required text closely 
   - No abbreviation expansion (Dist. won't match Distillery)
   - No semantic understanding (cannot infer meaning or context)

3. **Storage**:
   - In-memory storage only (all data lost on server restart)
   - Not suitable for production use without persistent storage
   - No submission history beyond current session

4. **Scalability**:
   - Single-instance deployment (no load balancing)
   - Google Cloud Vision API rate limits apply
   - 10MB file size limit per upload

### Functional Limitations
1. **No Multi-Language Support**: English only
2. **No Unit Conversion**: ml vs fl oz must match exactly with selection (no automatic conversion)
3. **No Template Recognition**: Doesn't identify specific label regions
4. **No Duplicate Detection**: Same label can be submitted multiple times
5. **No Batch Processing**: One label at a time
6. **No Data Export**: Admin cannot export submission data or reports

### Security Limitations
1. **Basic Authentication Only**: Simple username/password (no OAuth, JWT, or sessions)
2. **No Rate Limiting**: Vulnerable to API abuse without additional middleware
3. **No File Virus Scanning**: Uploaded images not scanned for malware
4. **CORS Configured for Development**: Production requires tighter CORS policy

## Running Tests

### Backend Tests
```bash
cd backend
npm test                 # Run all tests (173 tests)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                 # Run all tests
```

## API Endpoints

### Public Endpoints
- **POST** `/api/verify` - Submit label for verification
  - Body: multipart/form-data (image + form fields)
  - Returns: Verification results with field-by-field status

- **GET** `/health` - Health check
  - Returns: `{ status: 'ok' }`

### Admin Endpoints (Basic Auth Required)
- **POST** `/api/admin/login` - Admin login
- **GET** `/api/admin/submissions` - List all submissions (query param: ?status=pending|approved|rejected)
- **GET** `/api/admin/submissions/:id` - Get submission details
- **PATCH** `/api/admin/submissions/:id/status` - Update submission status

## Documentation

### Submission Documents
- **[Requirements List](submission-docs/REQUIREMENTS_LIST.md)** - Complete project requirements tracking
- **[Bonus Features](submission-docs/BONUS_FEATURES.md)** - Additional features beyond requirements
- **[Design Decisions](submission-docs/DESIGN_DECISIONS.md)** - Architectural choices and rationale

### Planning Documents
- [Backend Architecture](planning-docs/BACKEND_ARCHITECTURE.md) - Detailed backend design
- [Frontend Architecture](planning-docs/FRONTEND_ARCHITECTURE.md) - Angular application structure
- [Testing Strategy](planning-docs/TESTING_STRATEGY.md) - Test coverage and approach
- [Tech Stack](planning-docs/TECH_STACK.md) - Technology choices and configurations
- [Backend Features](planning-docs/BACKEND_FEATURES.md) - Feature implementation details
- [Frontend Features](planning-docs/FRONTEND_FEATURES.md) - UI/UX features

### Backend Layer Documentation
- [API Layer](backend/src/api/api.md) - Controllers, routes, middleware
- [Common Types](backend/src/common/common.md) - Shared types and enums
- [OCR Service](backend/src/services/engine/ocr/ocr.md) - Text extraction
- [Verification Service](backend/src/services/engine/verification/verification.md) - Label verification
- [Verification Manager](backend/src/services/manager/label-verification/manager.md) - Business orchestration
- [Utilities](backend/src/services/utility/utilities.md) - Image processing and validation
- [Validation](backend/src/services/validation/validation.md) - Input validation

### Frontend Layer Documentation
- [Core Layer](frontend/src/app/core/core.md) - Auth and toast services
- [Shared Layer](frontend/src/app/shared/shared.md) - Models, enums, constants
- [Label Verification Feature](frontend/src/app/features/label-verification/label-verification.md) - Main verification workflow
- [Admin Feature](frontend/src/app/features/admin/admin.md) - Admin dashboard and review