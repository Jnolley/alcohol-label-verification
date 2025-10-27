# Frontend Architecture - TTB Label Verification App

**Framework:** Angular 19 (LTS) with TypeScript
**State Management:** @ngrx/signals
**Purpose:** User interface for label verification workflow

---

## Architecture Overview

```mermaid
graph LR
    User[User] --> Component[Component]
    Component --> Store[Store/Signal]
    Store --> Service[Service]
    Service --> API[HttpClient]
    API --> Backend[Backend API]
```

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       └── api.service.ts
│   │
│   ├── shared/
│   │   ├── models/
│   │   ├── enums/
│   │   ├── constants/
│   │   └── components/
│   │
│   └── features/
│       └── label-verification/
│           ├── components/
│           ├── pages/
│           ├── services/
│           └── store/
│
└── environments/
```

---

## Architecture Layers

### Core Layer
**Purpose:** Global singleton services

- **ApiService** - HttpClient wrapper with interceptors

### Shared Layer
**Purpose:** Reusable code across features

- **Models** - TypeScript interfaces (contracts)
- **Enums** - Application enumerations
- **Constants** - Shared constants (e.g., icons)
- **Components** - Shared components (e.g., toast-container)

**Note:** Validators are handled via Angular's built-in `Validators` from `@angular/forms`. Test data generators (fakers) are not currently implemented as they are optional for MVP.

### Feature Layer
**Purpose:** Label verification feature

**Components:**
- Form component
- Upload component
- Results component

**Pages:**
- Verification page (container)

**Services:**
- Verification service (API calls)

**Store:**
- Verification store (@ngrx/signals)
- State management for form, image, results

---

## State Management with @ngrx/signals

### Verification Store

**State:**
- formData
- imageFile
- isSubmitting
- verificationResult
- error

**Methods:**
- setFormData()
- setImage()
- submitVerification()
- reset()

**Computed:**
- canSubmit (derived from formData + imageFile)
- hasResults (derived from verificationResult)

### Component State Management Pattern

All components with async operations follow a consistent state management pattern using Angular signals:

**Loading States:**
- `loading = signal(true)` - Tracks async operation progress
- Set to `true` before API calls
- Set to `false` on success or error
- Controls loading spinner visibility

**Error States:**
- `error = signal<string | null>(null)` - User-friendly error messages
- Reset to `null` before new operations
- Set with descriptive message on failure
- Displayed in error UI blocks

**Implementation Examples:**

**Login Component:**
```typescript
loading = signal(false);
error = signal<string | null>(null);

onSubmit(): void {
  this.loading.set(true);
  this.error.set(null);
  this.adminService.login(username, password).subscribe({
    next: () => { this.router.navigate(['/admin/dashboard']); },
    error: (err) => {
      this.loading.set(false);
      this.error.set('Invalid credentials');
    }
  });
}
```

**Dashboard Component:**
```typescript
submissions = signal<Submission[]>([]);
loading = signal(true);
error = signal<string | null>(null);

loadSubmissions(): void {
  this.loading.set(true);
  this.error.set(null);
  this.adminService.getSubmissions().subscribe({
    next: (response) => {
      this.submissions.set(response.submissions);
      this.loading.set(false);
    },
    error: (err) => {
      this.loading.set(false);
      this.error.set('Failed to load submissions');
    }
  });
}
```

**Image Annotator Component:**
```typescript
loading = signal(true);

private initCanvas(): void {
  this.loading.set(true);
  this.image.onload = () => {
    this.setupCanvas();
    this.annotateWords();
    this.render();
    this.loading.set(false);
  };
  this.image.onerror = () => {
    this.toastService.showError('Failed to load image');
    this.loading.set(false);
  };
}
```

This consistent pattern provides:
- Predictable state transitions across all components
- Clear user feedback during async operations
- Proper error recovery and messaging
- Unified UX with consistent loading spinners

---

## Design Principles

1. **Component-Based** - Angular components
2. **Reactive State** - @ngrx/signals for state
3. **Type Safety** - TypeScript throughout
4. **Unidirectional Data Flow** - Components → Store → Service → API
5. **Dependency Injection** - Angular DI

---

## Detailed Layer Documentation

Each layer has its own detailed documentation file:

- **[Core Layer](../frontend/src/app/core/core.md)** - Auth and toast services
- **[Shared Layer](../frontend/src/app/shared/shared.md)** - Models, enums, constants, components
- **[Label Verification Feature](../frontend/src/app/features/label-verification/label-verification.md)** - Main verification workflow with components, services, and store
- **[Admin Feature](../frontend/src/app/features/admin/admin.md)** - Admin dashboard, submission review, and authentication
