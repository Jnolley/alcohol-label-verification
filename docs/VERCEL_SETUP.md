# Vercel Deployment Setup Guide

This guide walks you through setting up automated deployments to Vercel for both QA and Production environments.

---

## Prerequisites

- GitHub repository connected to your account
- Vercel account (sign up at https://vercel.com)
- Admin access to the GitHub repository

---

## Part 1: Initial Vercel Setup (Online Steps)

### Step 1: Create Vercel Account & Import Project

1. Go to https://vercel.com and sign in with your GitHub account
2. Click **"Add New Project"**
3. Select **Import Git Repository**
4. Find and select `Jnolley/alcohol-label-verification`
5. Click **Import**

### Step 2: Configure Frontend Project (IMPORTANT)

Since this is a monorepo with separate frontend and backend, you need to create **TWO separate projects**.

#### Frontend Project Configuration:

Fill in the Vercel import form with these exact values:

**Project Name:**
```
alcohol-label-verification-frontend
```

**Framework Preset:**
```
Angular
```

**Root Directory:**
```
frontend
```
⚠️ **IMPORTANT**: Click the "Edit" button next to "Root Directory" and type `frontend`

**Build Command:**
```
npm run build
```
(Should auto-fill, but verify it matches)

**Output Directory:**
```
dist/frontend/browser
```
(Change from default `dist/browser` to `dist/frontend/browser`)

**Install Command:**
```
npm ci
```
(Should auto-fill)

**Environment Variables:**
- Skip for now (we'll add them in Step 3)

Click **"Deploy"** and wait for the build to complete.

---

### Step 2b: Configure Backend Project (Separate Project)

After the frontend deploys successfully:

1. Go back to Vercel dashboard
2. Click **"Add New Project"**
3. Select the **SAME repository** (`Jnolley/alcohol-label-verification`)
4. Fill in these values:

**Project Name:**
```
alcohol-label-verification-backend
```

**Framework Preset:**
```
Other
```

**Root Directory:**
```
backend
```
⚠️ **IMPORTANT**: Click "Edit" and type `backend`

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm ci
```

**Environment Variables:**
- Skip for now (we'll add them in Step 3)

Click **"Deploy"** and wait for the build to complete.

### Step 3: Set Up Environment Variables

#### Frontend Project:
Go to **Settings → Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `staging` | Preview |

#### Backend Project:
Go to **Settings → Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `staging` | Preview |
| `PORT` | `3000` | All |

---

## Part 2: Branch-Based Deployment Configuration

### QA Environment (Auto-deploy on `develop` merges)

1. Go to **Settings → Git** in your Vercel project
2. Under **Production Branch**, set to: `main`
3. Under **Preview Deployments**, ensure enabled for: `develop`

This configuration means:
- ✅ Merges to `develop` → Automatic Preview deployment (QA)
- ✅ Merges to `main` → Production deployment (manual approval needed)

### Production Environment (Manual deployments)

1. Go to **Settings → Git**
2. Enable **"Automatically expose System Environment Variables"**
3. Disable **"Auto-expose preview deployment URL"** (optional, for security)

---

## Part 3: Manual Production Deployment Setup

To require manual approval for production:

1. Go to **Settings → Git → Deploy Hooks**
2. Click **Create Hook**
3. Name: `Production Deploy`
4. Branch: `main`
5. Copy the generated webhook URL

### Using the Deploy Hook:

When ready to deploy to production:
```bash
# Option 1: Use the Deploy Hook URL
curl -X POST https://api.vercel.com/v1/integrations/deploy/[YOUR_HOOK_ID]

# Option 2: Use Vercel CLI
npm i -g vercel
vercel --prod
```

---

## Part 4: Connect Both Projects (Frontend + Backend)

### CORS Configuration

Update the backend to allow requests from Vercel frontend:

1. Get your Vercel frontend URL (e.g., `your-app.vercel.app`)
2. In Vercel Backend project, add environment variable:
   - `CORS_ORIGIN` = `https://your-app.vercel.app`

### Frontend API Configuration

1. In Vercel Frontend project, add environment variable:
   - `API_URL` = `https://your-backend.vercel.app`

---

## Part 5: GitHub Integration & Automatic Deployments

### Enable GitHub App

1. Go to **Settings → Git**
2. Ensure GitHub integration is enabled
3. Configure deployment settings:
   - ✅ **Production Branch**: `main`
   - ✅ **Preview Branches**: `develop`, `feature/*`
   - ✅ **Ignored Build Step**: Configure if needed

### Deployment Workflow

```
Feature Branch (feature/*)
    ↓ (creates PR to develop)
    ↓ Preview deployment created automatically
    ↓
Develop Branch (QA)
    ↓ (merge PR)
    ↓ Automatic QA deployment
    ↓ (QA testing & approval)
    ↓
Main Branch (Production)
    ↓ (merge PR or manual trigger)
    ↓ Production deployment (with approval)
```

---

## Part 6: Vercel CLI Setup (Optional)

For local testing and manual deployments:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview (from any branch)
cd frontend
vercel

# Deploy to production (from main branch)
vercel --prod

# Deploy backend
cd ../backend
vercel --prod
```

---

## Part 7: Domain Configuration (Production Only)

### Custom Domain Setup:

1. Go to **Settings → Domains**
2. Click **Add Domain**
3. Enter your custom domain (e.g., `label-verification.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

### Recommended Domain Structure:
- Frontend: `label-verification.yourdomain.com`
- Backend: `api.label-verification.yourdomain.com`
- QA Frontend: `qa.label-verification.yourdomain.com`
- QA Backend: `qa-api.label-verification.yourdomain.com`

---

## Verification Checklist

After setup, verify:

- [ ] Frontend deploys successfully to Vercel
- [ ] Backend deploys successfully to Vercel
- [ ] Environment variables are set correctly
- [ ] CORS is configured between frontend and backend
- [ ] QA deployments trigger on `develop` merges
- [ ] Production requires manual deployment
- [ ] SSL certificates are active
- [ ] Custom domains are configured (if applicable)

---

## Monitoring & Logs

### View Deployment Logs:
1. Go to **Deployments** tab
2. Click on any deployment
3. View **Build Logs** and **Function Logs**

### Set Up Monitoring:
1. Go to **Analytics** tab
2. Enable Web Analytics
3. Configure alerts for errors

---

## Common Issues & Solutions

### Issue: Build Fails
**Solution**: Check build logs for errors. Common causes:
- Missing environment variables
- Incorrect build command
- Dependencies not installed

### Issue: API Requests Fail (CORS)
**Solution**:
- Verify `CORS_ORIGIN` is set correctly in backend
- Check frontend is using correct `API_URL`

### Issue: Preview Deployment Not Created
**Solution**:
- Ensure Git integration is enabled
- Check branch is not in ignored list
- Verify Vercel has access to repository

---

## Deployment Best Practices

1. **Always test in Preview before Production**
   - Merge to `develop` first
   - Test QA deployment thoroughly
   - Only merge to `main` after QA approval

2. **Use Environment Variables for Configuration**
   - Never hardcode URLs or secrets
   - Use different values for Preview vs Production

3. **Monitor Deployments**
   - Check deployment status in Vercel dashboard
   - Review logs for errors
   - Set up error alerts

4. **Keep Dependencies Updated**
   - Regularly update npm packages
   - Test updates in Preview first

---

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- GitHub Discussions: Use project discussions for questions
- Vercel Community: https://github.com/vercel/vercel/discussions

---

## Next Steps

After completing this setup:

1. ✅ Test a deployment to develop (QA)
2. ✅ Verify the application works correctly
3. ✅ Configure any additional environment variables
4. ✅ Set up custom domains (if applicable)
5. ✅ Document any project-specific configuration
6. ✅ Train team on deployment process
