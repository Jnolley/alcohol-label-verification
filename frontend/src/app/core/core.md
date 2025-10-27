# Core Layer

Global singleton services used throughout the application.

## Structure

```
core/
└── services/
    ├── auth.service.ts        # Admin authentication
    └── toast.service.ts       # Toast notifications
```

## Services

### Auth Service

Manages admin authentication and authorization state.

**Responsibilities:**
- Login with username/password
- Logout and clear session
- Check authentication status
- Store authentication state in localStorage

**State Management:**
- Uses Angular Signals for reactive state
- `isAuthenticated` signal tracks login status
- Persists auth token in localStorage

**Methods:**
- `login(username, password): Observable<void>` - Authenticate admin
- `logout(): void` - Clear authentication
- `isAuthenticated(): Signal<boolean>` - Get auth status

**API Integration:**
- Calls `POST /api/admin/login` endpoint
- Receives auth token on successful login
- Stores token for subsequent admin API calls

---

### Toast Service

Displays temporary notification messages to users.

**Responsibilities:**
- Show success/error/info messages
- Auto-dismiss after timeout
- Manage toast message queue

**State Management:**
- Uses Angular Signals for reactive toast state
- `toasts` signal holds array of active toasts
- Each toast has: id, message, type, duration

**Methods:**
- `success(message: string): void` - Show success toast
- `error(message: string): void` - Show error toast
- `info(message: string): void` - Show info toast
- `remove(id: string): void` - Manually remove toast

**Configuration:**
- Default duration: 3000ms (3 seconds)
- Auto-dismisses unless manually closed
- Toast types: success, error, info

---

## Usage

Services are provided at the root level and injected where needed:

```typescript
import { AuthService } from '@/app/core/services/auth.service';
import { ToastService } from '@/app/core/services/toast.service';

export class MyComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
}
```