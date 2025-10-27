# Admin Feature

Administrative dashboard for reviewing and managing label verification submissions.

## Structure

```
admin/
├── components/
│   └── image-annotator/       # Canvas-based OCR annotation display
├── guards/
│   └── admin.guard.ts        # Route protection (auth required)
├── pages/
│   ├── login/                # Admin login page
│   ├── dashboard/            # Submissions list page
│   └── submission-detail/    # Individual submission review
└── services/
    └── admin.service.ts      # Admin API calls
```

## Flow

```mermaid
sequenceDiagram
    participant User as Admin User
    participant Login as Login Page
    participant Auth as Auth Service
    participant Guard as Admin Guard
    participant Dashboard
    participant Detail as Submission Detail
    participant Service as Admin Service
    participant API as Backend API

    User->>Login: Enter credentials
    Login->>Auth: login(username, password)
    Auth->>API: POST /api/admin/login
    API->>Auth: Token
    Auth->>Login: Success
    Login->>Dashboard: Navigate to /admin

    Dashboard->>Guard: canActivate()
    Guard->>Auth: isAuthenticated()
    alt Authenticated
        Guard->>Dashboard: Allow access
        Dashboard->>Service: getSubmissions()
        Service->>API: GET /api/admin/submissions
        API->>Dashboard: Submission[]
        Dashboard->>User: Display list

        User->>Detail: Click submission
        Detail->>Service: getSubmission(id)
        Service->>API: GET /api/admin/submissions/:id
        API->>Detail: Submission with OCR data
        Detail->>User: Show details + annotations

        User->>Detail: Approve/Reject
        Detail->>Service: updateStatus(id, status)
        Service->>API: PATCH /api/admin/submissions/:id/status
        API->>Detail: Updated submission
        Detail->>Dashboard: Navigate back
    else Not Authenticated
        Guard->>Login: Redirect to /admin/login
    end
```

## Components

### Image Annotator
Canvas-based component for displaying OCR bounding boxes over label images.

**Location:** `components/image-annotator/`

**Features:**
- Renders label image on HTML5 canvas
- Draws bounding boxes around detected words
- Shows word text and confidence scores
- Responsive canvas sizing

**Inputs:**
- `imageUrl: string` - Label image URL
- `words: DetectedWord[]` - OCR detected words with bounding boxes
- `imageDimensions: { width, height }` - Original image dimensions

**Rendering:**
- Red rectangles for word bounding boxes
- Word text displayed above each box
- Confidence score shown as percentage
- Scales to fit container while maintaining aspect ratio

---

## Pages

### Login Page
Admin authentication page.

**Location:** `pages/login/`

**Route:** `/admin/login`

**Features:**
- Username and password fields
- Form validation
- Error display for failed login
- Redirects to dashboard on success

**Flow:**
1. Admin enters credentials
2. Calls AuthService.login()
3. On success, navigate to `/admin`
4. On error, display error message

---

### Dashboard Page
Lists all submissions with filtering.

**Location:** `pages/dashboard/`

**Route:** `/admin`

**Features:**
- Display all submissions in table/list
- Filter by status (All, Pending, Approved, Rejected)
- Show submission metadata:
  - Timestamp
  - Brand name
  - Status
  - Verification result (passed/failed)
- Click submission to view details
- Logout button

**Filtering:**
- All: Show all submissions
- Pending: Show only pending submissions
- Approved: Show only approved submissions
- Rejected: Show only rejected submissions

**Protected Route:**
- Requires authentication (AdminGuard)
- Redirects to login if not authenticated

---

### Submission Detail Page
Detailed view of a single submission with OCR annotations.

**Location:** `pages/submission-detail/`

**Route:** `/admin/submissions/:id`

**Features:**
- Display label image with OCR bounding boxes
- Show extracted text from OCR
- Display form data submitted by user
- Show field-by-field verification results
- Approve/Reject buttons
- Back to dashboard link

**Sections:**
1. **Image Preview** - Label with annotations
2. **OCR Results** - Raw extracted text
3. **Form Data** - User-submitted values
4. **Verification Results** - Field checks
5. **Actions** - Approve/Reject buttons

**Actions:**
- Approve: Change status to "approved"
- Reject: Change status to "rejected"
- Updates via AdminService.updateSubmissionStatus()

**Protected Route:**
- Requires authentication (AdminGuard)

---

## Services

### Admin Service

Handles API communication for admin operations.

**Location:** `services/admin.service.ts`

**Methods:**

**`getSubmissions(status?: SubmissionStatus): Observable<Submission[]>`**
- Fetches all submissions from backend
- Optional status filter (pending, approved, rejected)
- Calls `GET /api/admin/submissions?status={status}`

**`getSubmission(id: string): Observable<Submission>`**
- Fetches single submission by ID
- Includes full OCR data and bounding boxes
- Calls `GET /api/admin/submissions/:id`

**`updateSubmissionStatus(id: string, status: SubmissionStatus): Observable<Submission>`**
- Updates submission status
- Calls `PATCH /api/admin/submissions/:id/status`
- Returns updated submission

**Error Handling:**
- Catches HTTP errors
- Returns user-friendly error messages
- Shows toast notifications on errors

---

## Guards

### Admin Guard

Route guard for protecting admin routes.

**Location:** `guards/admin.guard.ts`

**Purpose:**
- Prevent unauthorized access to admin pages
- Redirect to login if not authenticated

**Implementation:**
```typescript
canActivate(): boolean {
  if (authService.isAuthenticated()) {
    return true;
  }
  router.navigate(['/admin/login']);
  return false;
}
```

**Protected Routes:**
- `/admin` (dashboard)
- `/admin/submissions/:id` (detail)

**Unprotected Route:**
- `/admin/login` (public access)

---

## Routes

```typescript
{
  path: 'admin',
  children: [
    {
      path: 'login',
      component: LoginPageComponent
    },
    {
      path: '',
      component: DashboardPageComponent,
      canActivate: [AdminGuard]
    },
    {
      path: 'submissions/:id',
      component: SubmissionDetailPageComponent,
      canActivate: [AdminGuard]
    }
  ]
}
```

---

## Authentication

**Storage:**
- Auth token stored in localStorage
- Key: `auth_token`
- Set on login, cleared on logout

**Authorization:**
- Token sent in Authorization header for admin API calls
- Backend validates token for protected endpoints

**Session Management:**
- Token persists across page refreshes
- Logout clears token and redirects to login