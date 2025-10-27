# Frontend Features - TTB Label Verification App

**Based on:** Requirements PDF and REQUIREMENTS.md
**Purpose:** Define user-facing features and their architectural placement

---

## Feature Overview

### 1. Form Input
**Description:** Collect label information from user for verification

**Required Fields:**
- Brand Name (text input)
- Product Class/Type (text input)
- Alcohol Content - ABV (number input)

**Optional Fields:**
- Net Contents (text input)

**Validation:**
- Required field checks
- Format validation (ABV 0-100%)
- Field length constraints

**Architecture Mapping:**
```
Feature Layer: Form Component
Uses: Shared/Validators
Output: Form data object
```

---

### 2. Image Upload
**Description:** Allow user to upload label image for OCR processing

**Capabilities:**
- File selection (file input or drag-and-drop)
- File type validation (JPEG, PNG)
- File size validation (max 10MB)

**User Experience:**
- Show selected filename and size
- Allow image removal/change
- Clear upload button/area

**Architecture Mapping:**
```
Feature Layer: Upload Component
Uses: Shared/Validators (file validation)
Output: Image file object
```

---

### 3. Image Preview Display
**Description:** Show uploaded image to user before submission

**Capabilities:**
- Display uploaded image
- Responsive image sizing
- Maintain aspect ratio
- Show image dimensions/size

**User Experience:**
- Clear visual of what will be verified
- Image displays alongside form or in dedicated area
- Updates when new image selected

**Architecture Mapping:**
```
Feature Layer: Upload Component or Page Container
Input: Image file object
Display: Image preview
```

---

### 4. Form Validation Feedback
**Description:** Show inline validation errors to guide user input

**Capabilities:**
- Real-time or on-blur validation
- Field-specific error messages
- Visual error indicators
- Prevent submission if invalid

**Error Types:**
- Required field missing
- Invalid format (e.g., ABV not a number)
- Out of range (e.g., ABV > 100%)
- Invalid field length

**User Experience:**
- Red border or highlight on invalid field
- Error message below field
- Clear explanation of what's wrong
- Errors clear when corrected

**Architecture Mapping:**
```
Feature Layer: Form Component
Uses: Shared/Validators
Display: Inline error messages
```

---

### 5. Loading/Processing Indicator
**Description:** Show feedback while backend processes image

**Capabilities:**
- Spinner or progress indicator
- Disable form during processing
- Clear status message
- Consistent loading states across all async operations

**User Experience:**
- Button shows "Verifying..." state
- Form fields disabled during processing
- Visual spinner or loading animation
- Clear indication work is in progress
- Loading spinners during image loading, data fetching, authentication

**Implemented Components:**
- **Login Component** - Loading spinner during authentication
- **Dashboard Component** - Loading spinner while fetching submissions
- **Submission Detail Component** - Loading spinner while loading individual submission
- **Image Annotator Component** - Loading spinner while image processes and annotates
- **Verification Store** - Loading state during OCR processing

**Consistent Styling:**
- All loading spinners use `border-primary` Tailwind class
- All primary buttons use `bg-primary` with `hover:bg-blue-700`
- Unified spinner animation: `animate-spin rounded-full h-12 w-12 border-b-2 border-primary`
- Consistent min-height during loading to prevent layout shifts

**Architecture Mapping:**
```
Feature Layer: All Components with Async Operations
State: loading = signal(true/false)
Display: Conditional loading UI with @if (loading())
Pattern: Set true before async, false on complete/error
```

---

### 6. Instructions & Help Text
**Description:** Guide users on how to use the application

**Capabilities:**
- Page title and description
- Field-level help text
- Image requirements guidance
- Examples of valid input

**Content:**
- "Enter label information and upload image"
- "Accepted formats: JPEG, PNG"
- Example values for each field
- What happens after submission

**Architecture Mapping:**
```
Feature Layer: Page Container, Form Component
Display: Static help text, tooltips
```

---

### 7. Submission & Processing
**Description:** Submit form data and image to backend for verification

**Flow:**
1. User clicks submit button
2. Form and image validated
3. Data sent to backend API
4. Loading state displayed
5. Results received and displayed

**States:**
- Idle (ready to submit)
- Submitting (loading)
- Success (results received)
- Error (submission failed)

**Architecture Mapping:**
```
Feature Layer: Page Container
Calls: Feature Service → API Client
Uses: Shared/Contracts
Output: Verification result
```

---

### 4. Results Display - Success
**Description:** Show successful verification when all fields match

**Display Elements:**
- Success indicator (green/checkmark)
- Success message
- Field-by-field breakdown showing all matches
- Each field marked as verified

**Architecture Mapping:**
```
Feature Layer: Results Component
Input: Verification result (success: true)
Uses: Shared/Enums (MatchStatus)
```

---

### 5. Results Display - Failure
**Description:** Show verification failures with ALL discrepancies

**Display Elements:**
- Failure indicator
- Failure message
- Field-by-field breakdown showing:
  - Which fields matched
  - Which fields mismatched
  - Which fields were not found
- Specific error messages for each mismatch

**Requirements:**
- Must show ALL discrepancies, not just first one
- Clear explanation of what didn't match
- Show expected vs found values

**Architecture Mapping:**
```
Feature Layer: Results Component
Input: Verification result (success: false)
Uses: Shared/Enums (MatchStatus, FieldType)
```

---

### 6. Results Display - Error
**Description:** Show error when image cannot be processed

**Display Elements:**
- Warning indicator (yellow/warning icon)
- Error message
- Helpful hint (e.g., "try a clearer image")

**Error Scenarios:**
- Image could not be read
- OCR failed
- Low confidence score
- Invalid image format
- Network error

**Architecture Mapping:**
```
Feature Layer: Results Component
Input: Error response from API
Display: User-friendly error message
```

---

### 7. Visual Indicators
**Description:** Clear visual feedback for verification status

**Indicator Types:**
- Success: Green color, checkmark icon
- Failure: Red color, X icon
- Warning: Yellow color, warning icon
- Match: Green checkmark per field
- Mismatch: Red X per field
- Not Found: Yellow warning per field

**Architecture Mapping:**
```
Feature Layer: Results Component
Uses: CSS styling, icon system
Based on: Shared/Enums (MatchStatus)
```

---

### 8. Retry/Reset Functionality
**Description:** Allow user to verify another label without refilling form

**Capabilities:**
- Clear results
- Keep form data (user preference)
- Clear image selection
- Reset to initial state

**User Experience:**
- "Verify Another Label" button
- Option to edit form if mismatch found
- Upload different image without losing form data

**Architecture Mapping:**
```
Feature Layer: Page Container
Action: Reset component state
Keeps: Form data (optional)
Clears: Image, results, errors
```

---

## Feature-to-Architecture Mapping

| Feature | Layer | Components | Shared Resources |
|---------|-------|------------|------------------|
| Form Input | Feature | Form Component | Validators, Contracts |
| Image Upload | Feature | Upload Component | Validators |
| Submission | Feature | Page Container, Service | Contracts, API Client |
| Success Display | Feature | Results Component | Enums, Contracts |
| Failure Display | Feature | Results Component | Enums, Contracts |
| Error Display | Feature | Results Component | Contracts |
| Visual Indicators | Feature | Results Component | CSS, Icons |
| Retry/Reset | Feature | Page Container | State management |

---

## User Journey

```
1. User arrives at page
   ↓
2. User fills form fields (Feature 1)
   ↓
3. User uploads label image (Feature 2)
   ↓
4. User clicks "Verify Label"
   ↓
5. System submits to backend (Feature 3)
   ↓
6. System displays result:
   - Success → Feature 4
   - Failure → Feature 5
   - Error → Feature 6
   (with visual indicators from Feature 7)
   ↓
7. User reviews results
   ↓
8. User can retry (Feature 8)
```

---

## Non-Functional Features

### Accessibility
- Proper form labels
- ARIA attributes for screen readers
- Keyboard navigation support
- Color contrast compliance

### Responsiveness
- Mobile-friendly layout
- Touch-friendly controls
- Adaptive image preview

### Performance
- Client-side validation before API call
- Optimized image preview
- Minimal re-renders

---

## Out of Scope (Not Required for MVP)

- User authentication
- Session persistence
- Result history
- Multiple image upload
- Batch processing
- Export results
- Advanced OCR settings
- Government warning text highlighting (bonus feature)
