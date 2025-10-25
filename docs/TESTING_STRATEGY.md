# Testing Strategy - TTB Label Verification App

## Testing Philosophy

- **Test Pyramid**: Unit tests (70%) > Integration tests (20%) > E2E tests (10%)
- **Government Software Standards**: High code coverage and reliability
- **Fast Feedback**: Tests run on every PR
- **Maintainability**: Clear, readable tests that serve as documentation

---

## Frontend Testing (Angular 19 + Jasmine/Karma)

### Unit Tests

**Components:**
- Test component logic in isolation
- Mock dependencies (services, store)
- Test user interactions
- Test conditional rendering
- Test input/output bindings

**Services:**
- Test business logic
- Test HTTP calls (mocked)
- Test error handling
- Test data transformations

**Store:**
- Test state mutations
- Test event handlers
- Test computed signals
- Test initial state

**Coverage Target:** 80% minimum

### Integration Tests

**Component Integration:**
- Test component + service integration
- Test form validation flows
- Test file upload flows
- Test error handling flows

### E2E Tests (Cypress)

**User Flows:**
- Complete verification flow (form → upload → submit → results)
- Form validation scenarios
- Error handling flows
- Reset and retry flows

**Coverage Target:** Critical user paths

### Testing Tools

- **Jasmine**: Test framework (unit tests)
- **Karma**: Test runner (unit tests)
- **Cypress**: E2E testing framework
- **Angular Testing Utilities**: TestBed, ComponentFixture
- **Coverage**: karma-coverage

---

## Backend Testing (Node.js + TypeScript)

### Unit Tests

**Services:**
- Validation service tests
- Manager service tests
- Engine service tests (OCR, verification)
- Utility service tests

**Coverage Target:** 85% minimum

### Integration Tests

**API Endpoints:**
- POST /api/verify with valid data
- POST /api/verify with invalid data
- POST /api/verify with missing fields
- POST /api/verify with invalid image

**OCR Integration:**
- Test Tesseract.js integration
- Test text extraction
- Test confidence scoring

### Testing Tools

- **Jest**: Test framework (to be added)
- **Supertest**: API testing (to be added)
- **ts-jest**: TypeScript support

---

## CI/CD Pipeline Testing

### PR Checks (Required)

1. **Lint Check**
   - ESLint for TypeScript
   - No warnings allowed in strict mode

2. **Unit Tests**
   - All unit tests must pass
   - Coverage threshold enforced

3. **Build Check**
   - Frontend builds successfully
   - Backend builds successfully
   - No TypeScript errors

4. **Type Check**
   - Strict TypeScript compilation
   - No `any` types in new code

### Merge Requirements

- All PR checks pass
- Code review approved
- Branch up to date with target

---

## Testing Workflow

### Local Development

```bash
# Frontend unit tests
cd frontend
npm test                    # Run tests in watch mode
npm run test:coverage       # Run with coverage report

# Frontend E2E tests
npm run cypress:open        # Open Cypress UI
npm run cypress:run         # Run headless

# Backend tests (when added)
cd backend
npm test
npm run test:coverage
```

### PR Workflow

1. Developer creates PR
2. GitHub Actions runs:
   - Lint check
   - Unit tests
   - Build check
   - Type check
3. Coverage report posted to PR
4. If all checks pass, PR can be reviewed
5. After approval, PR can be merged

### Main Branch Protection

- Requires PR before merge
- Requires passing checks
- Requires 1 approval (optional for solo dev)
- No force pushes

---

## Test Categories

### Critical Tests (Must Pass)

- Core verification logic
- Form validation
- Image upload validation
- API contract tests
- Store state management

### Important Tests (Should Pass)

- UI rendering
- Error handling
- Edge cases
- Loading states

### Nice-to-Have Tests

- Accessibility tests
- Performance tests
- Visual regression tests

---

## Testing Scenarios

### Frontend Scenarios

1. **Happy Path**
   - User fills form correctly
   - User uploads valid image
   - User submits and sees results

2. **Validation Errors**
   - Missing required fields
   - Invalid ABV range
   - File too large
   - Invalid file type

3. **API Errors**
   - Network failure
   - 400 Bad Request
   - 422 Unprocessable Entity
   - 500 Server Error

4. **Loading States**
   - Form submitting
   - Image uploading
   - Results loading

### Backend Scenarios

1. **Successful Verification**
   - All fields match
   - Some fields match
   - No fields match

2. **Validation Failures**
   - Missing required fields
   - Invalid field formats
   - Invalid image file

3. **OCR Failures**
   - Unreadable image
   - Low confidence
   - No text detected

---

## Code Coverage Requirements

### Minimum Coverage

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Excluded from Coverage

- Interface/type definitions
- Configuration files
- Test files
- Generated code

---

## Test Naming Convention

### Unit Tests

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

### Example

```typescript
describe('LabelFormComponent', () => {
  describe('onSubmit', () => {
    it('should emit form data when form is valid', () => {
      // Test implementation
    });

    it('should not emit when form is invalid', () => {
      // Test implementation
    });
  });
});
```

---

## Future Testing Enhancements

### Phase 2 (Post-MVP)

- E2E tests with Playwright
- Visual regression testing
- Performance testing
- Accessibility testing (WCAG AA compliance)

### Phase 3 (Production)

- Load testing
- Security testing
- Penetration testing
- Compliance validation testing

---

## Testing Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test** (when possible)
3. **Clear test names** describing expected behavior
4. **Mock external dependencies**
5. **Test behavior, not implementation**
6. **Keep tests simple and focused**
7. **Use test fixtures for complex data**
8. **Clean up after each test**

---

## Running Tests in CI/CD

### GitHub Actions Workflow

```yaml
- Run linting
- Run unit tests with coverage
- Upload coverage to codecov (optional)
- Run build
- Post results to PR
```

### Performance Targets

- Lint: < 30 seconds
- Unit tests: < 2 minutes
- Build: < 3 minutes
- **Total PR check time: < 5 minutes**

---

## Test Data Strategy

### Fixtures

- Store test data in `fixtures/` folders
- Use realistic test data matching PDF examples
- Example: "Old Tom Distillery" bourbon label

### Fakers

- Use `@faker-js/faker` for random test data (optional)
- Good for property-based testing
- Not for critical path tests

---

## Monitoring Test Health

### Metrics to Track

- Test execution time
- Test flakiness rate
- Code coverage trends
- Failed test frequency

### Action Items

- Fix flaky tests immediately
- Refactor slow tests
- Maintain >80% coverage
- Review failed tests within 24 hours
