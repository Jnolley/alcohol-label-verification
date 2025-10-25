# Backend Features - TTB Label Verification App

**Based on:** Requirements PDF and REQUIREMENTS.md
**Purpose:** Define backend processing features and their architectural placement

---

## Feature Overview

### 1. API Endpoint Handling
**Description:** Receive and handle HTTP requests from frontend

**Capabilities:**
- Accept POST requests to /api/verify
- Parse multipart/form-data content type
- Extract form fields and file upload
- Handle request errors
- Return appropriate HTTP status codes

**HTTP Methods:**
- POST /api/verify (main endpoint)

**Architecture Mapping:**
```
API Layer: Controller
Receives: HTTP Request (multipart/form-data)
Calls: Request DTO Mapper
Returns: HTTP Response
```

---

### 2. Request DTO Mapping
**Description:** Map incoming HTTP request data to domain models

**Capabilities:**
- Parse multipart form data
- Extract form fields
- Extract image file
- Map to domain contracts
- Validate presence of required data

**Mappings:**
- HTTP form fields → Domain FormData model
- HTTP file upload → Image buffer/stream

**Architecture Mapping:**
```
API Layer: Request Mapper
Input: HTTP Request DTO
Output: Domain models
Uses: Common/Contracts
```

---

### 3. Field Validation
**Description:** Validate form field data before processing

**Validation Rules:**
- Required fields present (brand name, product type, ABV)
- Field format validation (ABV is numeric)
- Field range validation (ABV 0-100%)
- Field length constraints
- Optional field handling (net contents)

**Validation Types:**
- Required field checks
- Data type validation
- Format validation
- Range validation
- Length validation

**Error Handling:**
- Throw FieldValidationException on failure
- Return specific validation error messages
- Include field name in error

**Architecture Mapping:**
```
Validation Layer: ValidateFields Service
Input: Domain FormData
Output: Validated FormData or Exception
Throws: FieldValidationException (400 error)
```

---

### 4. Image File Validation
**Description:** Validate uploaded image file before OCR processing

**Validation Rules:**
- File size check (max 10MB)
- File type validation (JPEG, PNG)
- Magic byte verification
- File integrity check
- File not corrupted

**Error Handling:**
- Throw ImageValidationException on failure
- Return specific error messages
- Clear indication of what failed

**Architecture Mapping:**
```
Utility Layer: ValidateImage Service
Input: Image buffer, filename
Output: Validation result or Exception
Throws: ImageValidationException (422 error)
```

---

### 5. Workflow Orchestration
**Description:** Coordinate the complete verification workflow

**Orchestration Steps:**
1. Validate image file (via ValidateImage)
2. Extract text from image (via ExtractText)
3. Verify fields (via VerifyLabel)
4. Aggregate results
5. Return verification result

**Error Handling:**
- Catch service exceptions
- Map to appropriate HTTP errors
- Maintain error context
- Clean error messages for frontend

**Architecture Mapping:**
```
Manager Layer: ProcessLabelVerification Service
Coordinates: Utility + Engine services
Input: Domain FormData + Image
Output: VerificationResult
Handles: All service errors
```

---

### 6. OCR Text Extraction
**Description:** Extract text from label image using OCR technology

**Capabilities:**
- Process image through OCR library
- Handle multiple image formats
- Return raw extracted text
- Return confidence score
- Handle OCR failures

**OCR Processing:**
- Image preprocessing (optional)
- OCR execution
- Text capture
- Confidence scoring

**Error Handling:**
- Low confidence detection
- OCR library errors
- Unreadable image detection
- Throw OCRException on failure

**Architecture Mapping:**
```
Engine Layer: ExtractText Service
Input: Image buffer
Output: ExtractedText (raw text, confidence)
Uses: Tesseract.js OCR library
Throws: OCRException (422 error)
```

---

### 7. Text Normalization
**Description:** Clean and normalize OCR-extracted text for comparison

**Normalization Steps:**
- Convert to uppercase (case-insensitive matching)
- Trim whitespace
- Remove extra spaces
- Normalize special characters
- Handle common OCR errors (optional)

**Output:**
- Normalized text string
- Preserved raw text for reference

**Architecture Mapping:**
```
Engine Layer: ExtractText Service
Part of: Text extraction process
Input: Raw OCR text
Output: Normalized text
```

---

### 8. Field Verification - Brand Name
**Description:** Verify brand name from form matches extracted text

**Verification Logic:**
- Case-insensitive comparison
- Substring matching (brand name in extracted text)
- Partial match acceptable
- Fuzzy matching (optional)

**Match Criteria:**
- Brand name found in extracted text
- Case differences ignored
- Order not critical

**Architecture Mapping:**
```
Engine Layer: VerifyLabel Service
Input: FormData.brandName, ExtractedText
Output: FieldCheck (status, expected, found, message)
Uses: Common/Enums (MatchStatus, FieldType)
```

---

### 9. Field Verification - Product Type
**Description:** Verify product type/class matches extracted text

**Verification Logic:**
- Case-insensitive comparison
- Partial keyword matching
- Handle variations (e.g., "Bourbon" vs "Kentucky Straight Bourbon Whiskey")
- Substring matching

**Match Criteria:**
- Product type keywords found in text
- Case differences ignored
- Partial matches acceptable

**Architecture Mapping:**
```
Engine Layer: VerifyLabel Service
Input: FormData.productType, ExtractedText
Output: FieldCheck (status, expected, found, message)
```

---

### 10. Field Verification - Alcohol Content
**Description:** Verify alcohol content (ABV) matches extracted text

**Verification Logic:**
- Extract numeric value from text
- Compare with form value
- Tolerance of ±0.5% acceptable
- Handle different formats ("45%", "45.0%", "45% Alc/Vol")

**Match Criteria:**
- Numeric match within tolerance
- Format variations handled
- Percentage symbol optional in text

**Architecture Mapping:**
```
Engine Layer: VerifyLabel Service
Input: FormData.alcoholContent, ExtractedText
Output: FieldCheck (status, expected, found, message)
```

---

### 11. Field Verification - Net Contents
**Description:** Verify net contents/volume matches extracted text (optional field)

**Verification Logic:**
- Normalize spacing ("750 mL" vs "750ML")
- Volume unit matching
- Number comparison
- Handle format variations

**Match Criteria:**
- Volume value matches
- Unit matches (mL, oz, etc.)
- Spacing differences ignored

**Optional Handling:**
- Skip if not provided in form
- Not required for MVP

**Architecture Mapping:**
```
Engine Layer: VerifyLabel Service
Input: FormData.netContents (optional), ExtractedText
Output: FieldCheck or null if not provided
```

---

### 12. Result Aggregation
**Description:** Collect all field verification results into single response

**Aggregation Logic:**
- Collect all FieldCheck results
- Determine overall success (all fields match)
- Generate summary message
- Maintain ALL discrepancies (not just first)

**Result Determination:**
- Success: All fields Match status
- Failure: Any field Mismatch or NotFound status

**Message Generation:**
- Success: "Label matches form data"
- Failure: "Label does not match form"
- Include field-specific messages

**Architecture Mapping:**
```
Engine Layer: VerifyLabel Service
Input: All FieldCheck results
Output: VerificationResult (success, message, fieldChecks[])
Uses: Common/Contracts
```

---

### 13. Response DTO Mapping
**Description:** Map domain verification result to HTTP response DTO

**Capabilities:**
- Map VerificationResult to response DTO
- Format for JSON serialization
- Include all field checks
- Format error responses

**Mappings:**
- VerificationResult → Response DTO
- Exception → Error DTO

**Architecture Mapping:**
```
API Layer: Response Mapper
Input: Domain VerificationResult or Exception
Output: HTTP Response DTO
Returns: JSON response
```

---

### 14. HTTP Response Formatting
**Description:** Format and return appropriate HTTP responses

**Response Types:**
- 200 OK: Verification complete (success or failure)
- 400 Bad Request: Field validation failed
- 422 Unprocessable Entity: Image validation or OCR failed
- 500 Internal Server Error: Unexpected errors

**Response Body:**
- Success/Failure: { success, message, fieldChecks[] }
- Error: { error: { code, message, details } }

**Architecture Mapping:**
```
API Layer: Controller
Input: Response DTO or Exception
Output: HTTP Response
Sets: Status code, headers, body
```

---

### 15. Exception Handling & Error Mapping
**Description:** Handle exceptions and map to appropriate HTTP errors

**Exception Types:**
- FieldValidationException → 400 Bad Request
- ImageValidationException → 422 Unprocessable Entity
- OCRException → 422 Unprocessable Entity
- Generic Exception → 500 Internal Server Error

**Error Response Format:**
- Error code (machine-readable)
- Error message (human-readable)
- Error details (optional)

**Architecture Mapping:**
```
API Layer: Controller (Exception Handler)
Catches: All service exceptions
Maps: Exception type → HTTP status code
Returns: Error response DTO
```

---

### 16. Logging & Observability
**Description:** Log processing steps and errors for debugging and monitoring

**Logging Points:**
- Request received
- Validation steps
- OCR processing start/complete
- Field verification results
- Errors and exceptions
- Response sent

**Log Levels:**
- INFO: Request/response, processing steps
- WARN: Validation failures, low confidence
- ERROR: Exceptions, OCR failures

**Architecture Mapping:**
```
All Layers: Logging service
Used by: Controller, Manager, Engine, Utility
Logs to: Console, file, or logging service
```

---

## Feature-to-Architecture Mapping

| Feature | Layer | Service | Dependencies |
|---------|-------|---------|--------------|
| API Endpoint Handling | API | Controller | - |
| Request DTO Mapping | API | Request Mapper | Common/Contracts |
| Field Validation | Validation | ValidateFields | Common/Contracts |
| Image File Validation | Utility | ValidateImage | - |
| Workflow Orchestration | Manager | ProcessLabelVerification | All services |
| OCR Text Extraction | Engine | ExtractText | OCR library |
| Text Normalization | Engine | ExtractText | - |
| Verify Brand Name | Engine | VerifyLabel | Common/Enums |
| Verify Product Type | Engine | VerifyLabel | Common/Enums |
| Verify Alcohol Content | Engine | VerifyLabel | Common/Enums |
| Verify Net Contents | Engine | VerifyLabel | Common/Enums |
| Result Aggregation | Engine | VerifyLabel | Common/Contracts |
| Response DTO Mapping | API | Response Mapper | Common/Contracts |
| HTTP Response Formatting | API | Controller | - |
| Exception Handling | API | Controller | Common/Exceptions |
| Logging & Observability | All | Logger | - |

---

## Processing Flow

```
1. HTTP Request arrives
   ↓ (Feature 1: API Endpoint)
2. Parse multipart form data
   ↓ (Feature 2: Request Mapping)
3. Map to domain models
   ↓ (Feature 3: Field Validation)
4. Validate form fields
   ↓ (Feature 5: Workflow Orchestration)
5. Validate image file
   ↓ (Feature 4: Image Validation)
6. Extract text via OCR
   ↓ (Feature 6: OCR Extraction)
7. Normalize extracted text
   ↓ (Feature 7: Text Normalization)
8. Verify each field:
   - Brand Name (Feature 8)
   - Product Type (Feature 9)
   - Alcohol Content (Feature 10)
   - Net Contents (Feature 11)
   ↓
9. Aggregate results
   ↓ (Feature 12: Result Aggregation)
10. Map to response DTO
    ↓ (Feature 13: Response Mapping)
11. Format HTTP response
    ↓ (Feature 14: HTTP Response)
12. Return to frontend

(Feature 15: Exception handling throughout)
(Feature 16: Logging throughout)
```

---

## Verification Rule Details

### Brand Name Matching
**Rule:** Case-insensitive substring match

**Examples:**
- Form: "Old Tom Distillery"
- Text: "OLD TOM DISTILLERY" → Match
- Text: "Old Tom's Distillery" → Match (substring)
- Text: "Tom Distillery" → Match (partial)
- Text: "Different Distillery" → Mismatch

### Product Type Matching
**Rule:** Case-insensitive partial keyword match

**Examples:**
- Form: "Kentucky Straight Bourbon Whiskey"
- Text: "KENTUCKY STRAIGHT BOURBON WHISKEY" → Match
- Text: "Bourbon Whiskey" → Match (keywords present)
- Text: "Bourbon" → Match (keyword present)
- Text: "Vodka" → Mismatch

### Alcohol Content Matching
**Rule:** Exact number match with ±0.5% tolerance

**Examples:**
- Form: 45
- Text: "45%" → Match
- Text: "45.0% Alc/Vol" → Match
- Text: "45.5%" → Match (within tolerance)
- Text: "46%" → Mismatch (outside tolerance)

### Net Contents Matching
**Rule:** Normalized spacing and unit match

**Examples:**
- Form: "750 mL"
- Text: "750ML" → Match (spacing normalized)
- Text: "750 mL" → Match (exact)
- Text: "750ml" → Match (case-insensitive)
- Text: "1L" → Mismatch

---

## Error Scenarios & Handling

### Field Validation Errors
**Scenario:** Missing required field, invalid format
- **Response:** 400 Bad Request
- **Body:** { error: { code: "FIELD_VALIDATION_FAILED", message: "...", field: "..." } }

### Image Validation Errors
**Scenario:** File too large, wrong format, corrupted
- **Response:** 422 Unprocessable Entity
- **Body:** { error: { code: "INVALID_IMAGE", message: "..." } }

### OCR Processing Errors
**Scenario:** Cannot read text, low confidence, OCR failure
- **Response:** 422 Unprocessable Entity
- **Body:** { error: { code: "OCR_FAILED", message: "..." } }

### Verification Failures
**Scenario:** Fields don't match (NOT an error)
- **Response:** 200 OK
- **Body:** { success: false, message: "...", fieldChecks: [...] }

---

## Service Dependencies

### Manager Service Dependencies
```
ProcessLabelVerification depends on:
- ValidateImage (Utility)
- ExtractText (Engine)
- VerifyLabel (Engine)
```

### Engine Service Dependencies
```
ExtractText depends on:
- OCR library (external)

VerifyLabel depends on:
- ExtractText output
- Domain contracts
- Enums
```

### Validation Service Dependencies
```
ValidateFields depends on:
- Domain contracts
- Validation rules
```

### Utility Service Dependencies
```
ValidateImage depends on:
- File system utilities
- Image processing libraries (optional)
```

---

## Non-Functional Features

### Security
- Input sanitization
- File upload validation
- No SQL injection risk (stateless)
- No authentication required (per requirements)

### Performance
- Efficient OCR processing
- Minimal memory usage
- Stream processing for large files
- Fast validation checks

### Reliability
- Graceful error handling
- Detailed error messages
- Fail-fast validation
- Comprehensive logging

### Maintainability
- Clear separation of concerns
- Interface-based design
- Testable services
- Well-defined contracts

---

## Out of Scope (Not Required for MVP)

- Database persistence
- User authentication/authorization
- Rate limiting
- Caching
- Async processing/queues
- Webhook notifications
- Batch processing
- Advanced OCR preprocessing
- Machine learning for text matching
- Government warning text verification (bonus feature)
- Multiple image uploads
- Historical result storage
