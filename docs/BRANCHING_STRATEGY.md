# Branching Strategy - TTB Label Verification App

## Branch Structure

### Main Branches

**`main`**
- Production-ready code
- Protected branch
- Requires PR + approval
- Auto-deploys to production (future)
- Tagged with version numbers

**`develop`** (Future - not implemented yet)
- Integration branch for features
- Deployed to QA environment
- Pre-release testing happens here
- Merges to `main` create releases

### Supporting Branches

**Feature Branches** (`feature/*`)
- Created from: `main` (or `develop` when implemented)
- Merged back to: `main` (or `develop`)
- Naming: `feature/description-of-feature`
- Example: `feature/ocr-integration`
- Example: `feature/verification-logic`

**Bugfix Branches** (`fix/*`)
- Created from: `main`
- Merged back to: `main`
- Naming: `fix/description-of-bug`
- Example: `fix/form-validation-error`

**Hotfix Branches** (`hotfix/*`)
- Created from: `main`
- Merged back to: `main` AND `develop`
- Naming: `hotfix/critical-bug-description`
- For critical production issues only

**Release Branches** (`release/*`) (Future)
- Created from: `develop`
- Merged to: `main` AND back to `develop`
- Naming: `release/v1.0.0`
- For final release preparation

---

## Workflow

### Current Workflow (MVP)

```
main
  └── feature/new-feature
       └── (PR) → main
```

1. Create feature branch from `main`
2. Develop feature
3. Create PR to `main`
4. PR checks run automatically
5. Code review
6. Merge to `main`

### Future Workflow (Post-MVP)

```
main (prod)
  └── develop (qa)
       └── feature/new-feature
            └── (PR) → develop
       └── (PR) → main (release)
```

1. Create feature branch from `develop`
2. Develop feature
3. Create PR to `develop`
4. PR checks + QA testing
5. Merge to `develop`
6. When ready for release, PR from `develop` to `main`
7. Deploy to production

---

## Branch Protection Rules

### `main` Branch

**Required:**
- ✅ Require PR before merging
- ✅ Require status checks to pass:
  - Lint check
  - Unit tests
  - Build check
  - Type check
- ✅ Require branches be up to date before merging
- ✅ No force pushes
- ✅ No deletions

**Optional (for team environment):**
- Require 1 approval
- Require conversation resolution
- Dismiss stale reviews

### `develop` Branch (Future)

**Required:**
- ✅ Require PR before merging
- ✅ Require status checks to pass
- ✅ No force pushes

---

## PR Checks (GitHub Actions)

### Required Checks

1. **Lint Check**
   ```bash
   npm run lint
   ```

2. **Unit Tests**
   ```bash
   npm test -- --watch=false --code-coverage
   ```

3. **Build Check**
   ```bash
   npm run build
   ```

4. **Type Check**
   ```bash
   tsc --noEmit
   ```

### Check Status

- ✅ All checks must pass
- ❌ Any failure blocks merge
- 🟡 Warnings reviewed but not blocking

---

## Naming Conventions

### Feature Branches

```
feature/ocr-tesseract-integration
feature/government-warning-check
feature/image-preview
feature/error-handling
```

### Bug Fix Branches

```
fix/form-validation-abv
fix/image-upload-size-limit
fix/store-reset-not-clearing
```

### Hotfix Branches

```
hotfix/critical-ocr-crash
hotfix/security-file-upload
```

### Release Branches (Future)

```
release/v1.0.0
release/v1.1.0
release/v2.0.0
```

---

## Commit Message Convention

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(verification): add OCR text extraction with Tesseract.js

Implemented OCR processing using Tesseract.js to extract text from
uploaded label images with confidence scoring.

feat(form): add alcohol content validation

fix(upload): increase max file size to 10MB

docs(readme): add setup instructions

test(store): add unit tests for verification store
```

---

## Release Process (Future)

### Version Numbers

Follow Semantic Versioning (semver):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

### Release Steps

1. Create release branch from `develop`
   ```bash
   git checkout develop
   git checkout -b release/v1.0.0
   ```

2. Update version numbers
   ```bash
   npm version minor
   ```

3. Update CHANGELOG.md

4. Create PR to `main`

5. After merge, tag release
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

6. Merge back to `develop`

7. Deploy to production

---

## Environment Strategy (Future)

### Environments

**Development**
- Branch: Feature branches
- Deploy: Local only
- Purpose: Active development

**QA/Staging**
- Branch: `develop`
- Deploy: Vercel preview
- Purpose: Integration testing
- URL: `qa.alcohol-label-verification.vercel.app`

**Production**
- Branch: `main`
- Deploy: Vercel production
- Purpose: Live application
- URL: `alcohol-label-verification.vercel.app`

---

## CI/CD Pipeline (Future)

### Development Pipeline

```yaml
Feature Branch Push
  → Lint + Test + Build
  → Preview Deploy (optional)
```

### QA Pipeline

```yaml
Merge to develop
  → Lint + Test + Build
  → Deploy to QA
  → Run integration tests
  → Notify team
```

### Production Pipeline

```yaml
Merge to main
  → Lint + Test + Build
  → Deploy to production
  → Run smoke tests
  → Create GitHub release
  → Tag version
```

---

## Current Implementation Status

### ✅ Implemented

- `main` branch protection
- PR workflow
- Basic commit structure

### 🔄 In Progress

- GitHub Actions for PR checks
- Unit tests for all components

### 📋 Planned (Not Yet Implemented)

- `develop` branch
- QA environment
- Production deployment
- Release process
- Automated versioning
- CHANGELOG automation

---

## Best Practices

1. **Keep branches short-lived** (< 3 days preferred)
2. **Small, focused PRs** (< 400 lines of changes)
3. **Rebase before creating PR** to keep history clean
4. **Delete merged branches** to reduce clutter
5. **Write descriptive commit messages**
6. **Reference issues in commits** when applicable
7. **Keep `main` always deployable**
8. **Never commit directly to `main`**

---

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch with latest main
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# Resolve conflicts
# Then continue
git rebase --continue
```

### Failed PR Checks

1. Pull latest changes
2. Run checks locally:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
3. Fix issues
4. Commit and push

### Accidental Commit to `main`

```bash
# If not pushed yet
git reset --soft HEAD~1
git checkout -b feature/my-feature
git push origin feature/my-feature

# If already pushed - contact team lead
```