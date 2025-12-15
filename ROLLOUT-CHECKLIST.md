# Club Cult - Production Rollout Checklist

## Pre-Deployment

### 1. Environment Variables
```bash
# Required in .env (or deployment platform env vars)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**⚠️ IMPORTANT:** The anon key must be a JWT token starting with `eyJ`. Get it from:
Supabase Dashboard → Settings → API → Project API keys → anon public

### 2. Supabase Dashboard Configuration

#### Enable Email Auth
1. Go to Authentication → Providers
2. Enable "Email" provider
3. Configure:
   - Enable "Confirm email" (recommended for production)
   - Set site URL to your production domain

#### Google OAuth (If using)
1. Create OAuth credentials in Google Cloud Console
2. In Supabase: Authentication → Providers → Google
3. Add Client ID and Secret
4. Add redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `https://your-domain.com/auth/callback`

### 3. Apply RLS Policies

Run in Supabase SQL Editor:
```sql
-- File: supabase/policies.sql
-- Run the entire file to create all RLS policies
```

Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 4. Storage Bucket Setup

1. Go to Storage → Create bucket "event-banners"
2. Set to **Public** bucket
3. Policies are applied via SQL (check policies.sql)

---

## Deployment Steps

### 1. Install Dependencies
```bash
npm ci
```

### 2. Build
```bash
npm run build
```

### 3. Type Check
```bash
npx tsc --noEmit
```

### 4. Run E2E Tests
```bash
npx playwright install
npx playwright test --project=chromium
```

### 5. Deploy
Deploy the `dist/` folder to your hosting platform (Vercel, Netlify, etc.)

---

## Post-Deployment Verification

### Manual Checks

| Check | Steps | Expected |
|-------|-------|----------|
| Home Page | Visit `/` | Hero section visible, no errors |
| Auth Redirect | Visit `/admin` logged out | Redirect to `/auth` |
| Login | Enter credentials | Toast "Welcome back!" |
| Create Event | Admin → Create Event | Form shows all fields |
| File Validation | Upload .pdf | Error "Only JPEG, PNG..." |
| RLS | Admin A views events | Only club A events |

### Console Check
Open browser DevTools → Console. Should see:
- ✅ No red errors
- ✅ No warnings about Supabase configuration

---

## Rollback Plan

If issues occur:
1. Revert deployment to previous version
2. Check Supabase logs for RLS errors
3. Verify environment variables are set correctly

---

## Load Testing (Optional)

Run on staging only:
```bash
# Install k6 first: https://k6.io/docs/get-started/installation/
k6 run qa-artifacts/load-test.js --env BASE_URL=https://staging.your-domain.com
```

Thresholds:
- Error rate < 1%
- p95 latency < 1.5s
