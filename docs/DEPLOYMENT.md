# Deployment & Release Strategy

## Branching Model

This project follows a Git Flow-based branching strategy with three main branches:

### Branch Structure

```
main (production)
  ↑
  | (manual release)
  |
develop (QA)
  ↑
  | (feature PRs)
  |
feature/* branches
```

### Branch Descriptions

**`main`** - Production Branch
- Represents the production-ready state
- Always deployable to production environment
- Protected branch - requires manual release process
- Deployments are triggered manually after QA approval

**`develop`** - QA/Staging Branch
- Main integration branch for all features
- Automatically deploys to QA environment on merge
- All feature branches merge here first
- CI/CD pipeline runs automated tests and deployments

**`feature/*`** - Feature Branches
- Created from `develop` for new features or bug fixes
- Naming convention: `feature/description` or `feat/description`
- Merged back to `develop` via Pull Request
- Deleted after successful merge

## Deployment Pipeline

### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Develop and commit
git add .
git commit -m "feat: implement my feature"

# Push and create PR to develop
git push -u origin feature/my-feature
gh pr create --base develop --head feature/my-feature
```

### 2. QA Deployment (Automatic)

When a PR is merged to `develop`:
1. **CI Pipeline Triggers**
   - Run automated tests (unit, integration, e2e)
   - Build backend and frontend
   - Run linting and type checking

2. **CD Pipeline Triggers** (on test success)
   - Deploy backend to QA environment
   - Deploy frontend to QA environment
   - Run smoke tests
   - Notify team of deployment status

3. **QA Testing**
   - Manual testing in QA environment
   - Verify functionality matches requirements
   - Check for regressions
   - Performance and load testing

### 3. Production Release (Manual)

After QA approval:

```bash
# Create release PR from develop to main
gh pr create --base main --head develop --title "Release vX.X.X"

# After approval, merge to main (manual trigger)
# This triggers production deployment pipeline
```

Production deployment steps:
1. **Pre-deployment Checks**
   - Verify all QA tests passed
   - Check database migrations
   - Review changelog

2. **Deployment**
   - Deploy backend to production
   - Deploy frontend to production
   - Run smoke tests in production

3. **Post-deployment**
   - Monitor error rates and performance
   - Verify core functionality
   - Tag release in git: `git tag -a vX.X.X -m "Release vX.X.X"`

## Environment Variables

### QA Environment
- `NODE_ENV=staging`
- Backend: `QA_API_URL`
- Frontend: `QA_FRONTEND_URL`

### Production Environment
- `NODE_ENV=production`
- Backend: `PROD_API_URL`
- Frontend: `PROD_FRONTEND_URL`

## CI/CD Configuration

### GitHub Actions Workflows

**`.github/workflows/qa-deploy.yml`** (Future)
- Trigger: Push to `develop`
- Jobs: test → build → deploy-qa

**`.github/workflows/prod-deploy.yml`** (Future)
- Trigger: Manual workflow dispatch from `main`
- Jobs: test → build → deploy-prod

## Rollback Strategy

If issues are detected in production:

1. **Immediate Rollback**
   ```bash
   # Revert to previous release tag
   git checkout <previous-tag>
   # Manual deployment trigger
   ```

2. **Fix Forward** (for minor issues)
   - Create hotfix branch from `main`
   - Fix issue and test
   - Merge to both `main` and `develop`

## Release Versioning

Follow Semantic Versioning (SemVer):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Best Practices

1. **Never commit directly to `develop` or `main`**
   - Always use Pull Requests
   - Require code review approval

2. **Keep feature branches small and focused**
   - Easier to review
   - Faster to merge
   - Reduces merge conflicts

3. **Test locally before pushing**
   - Run `npm test` in backend
   - Run `npm test` in frontend
   - Verify builds complete

4. **Update documentation with features**
   - Keep README current
   - Update API docs
   - Document breaking changes

5. **Clean up merged branches**
   - Delete feature branches after merge
   - Keep repository clean