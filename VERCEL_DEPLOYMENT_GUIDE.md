# Ceyteq Master Dashboard & Management Panel
## Production Vercel Deployment & DevOps Guide

This guide details the deployment of the Ceyteq Multi-Tenant Digital Menu and Management Platform on Vercel with enterprise-grade security, database pooling, AI chatbot stability, and multi-tenant custom domain routing.

---

## 1. Environment Variables Configuration

In your Vercel Project Settings (**Settings → Environment Variables**), configure the following production keys. Ensure you select the target environments (**Production**, **Preview**, **Development**).

| Variable Name | Description | Example / Recommendations |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Key for Jasmine AI & WhatsApp Bot | Get from Google AI Studio. Keep restricted to backend. |
| `APP_URL` | Canonical production domain | `https://dashboard.ceyteq.com` |
| `NEXTAUTH_URL` | Canonical auth callback base URL | `https://dashboard.ceyteq.com` |
| `NEXTAUTH_SECRET` | 32-byte cryptographically secure random string | Generate via: `openssl rand -base64 32` |
| `JWT_SECRET` | Secret key used for signing JWT access tokens | Generate via: `openssl rand -hex 32` |
| `DATABASE_URL` | **Pooled** PostgreSQL connection string | `postgresql://user:pass@pooler.neon.tech/ceyteq?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Direct unpooled DB connection (migrations only) | `postgresql://user:pass@ep-direct.neon.tech/ceyteq?sslmode=require` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for distributed sliding-window rate limiting | `https://eu1-active-server.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST access token | Provided in Upstash console |
| `RESEND_API_KEY` | Transactional email provider for OTP delivery | `re_123456789...` |
| `EMAIL_FROM` | Sender email address for 2FA / OTP emails | `security@ceyteq.com` |
| `WHATSAPP_CLOUD_API_TOKEN` | Meta Graph API permanent system user token | Token with `whatsapp_business_messaging` permissions |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Account Phone Number ID | From Meta Developers Dashboard |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Webhook verification challenge secret | Custom high-entropy token |

> **Security Tip**: Enable **"Automatically expose System Environment Variables"** only if needed, and make sure `GEMINI_API_KEY` and `DATABASE_URL` are **never** prefixed with `NEXT_PUBLIC_` or `VITE_`.

---

## 2. Vercel Configuration (`vercel.json`)

The application includes a `vercel.json` in the project root configured for high performance and zero-trust security:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(self)" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate, proxy-revalidate" },
        { "key": "Pragma", "value": "no-cache" }
      ]
    }
  ]
}
```

If utilizing Vercel Serverless Functions (`/api/*`), add function limits:
```json
{
  "functions": {
    "api/**/*.{js,ts}": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

---

## 3. Database & API Stability (Preventing Serverless Crashes)

### A. Connection Pooling (PostgreSQL / Prisma / Drizzle)
Serverless functions create ephemeral instances that scale rapidly under load. Without connection pooling, 100 concurrent requests can exhaust PostgreSQL connection limits (`FATAL: remaining connection slots are reserved`).
- **Use Neon / Supabase PgBouncer (Transaction Mode)** on Port `6543`.
- In your Prisma schema or DB client, set connection pool parameters:
  ```env
  DATABASE_URL="postgresql://user:pass@pooler.neon.tech/ceyteq?pgbouncer=true&connection_limit=1"
  ```
- Instantiate your database client outside request handlers (singleton pattern):
  ```typescript
  import { Pool } from 'pg';
  const globalForDb = global as unknown as { pool: Pool };
  export const pool = globalForDb.pool || new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // 1 connection per serverless lambdas
    idleTimeoutMillis: 10000,
  });
  if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;
  ```

### B. Function Timeouts (`maxDuration`)
Gemini AI Copilot queries, multi-turn reasoning, and WhatsApp webhook responses can take 5–15 seconds to stream:
- Default Vercel hobby timeout is 10s. On **Vercel Pro**, configure `maxDuration: 60` in route segment configs:
  ```typescript
  export const maxDuration = 60; // 60 seconds maximum execution
  export const dynamic = 'force-dynamic';
  ```
- For WhatsApp webhooks, **immediately return HTTP 200** to Meta within 3 seconds, then process the AI completion asynchronously or use Edge Runtime.

### C. Distributed Rate Limiting (Upstash Redis)
In-memory `Map` stores reset every time a serverless container spins down. For production:
- Use `@upstash/ratelimit` with Redis REST API.
- Enforce the 60 requests/min sliding window rate limit across all serverless regions uniformly.

---

## 4. Custom Domain & DNS Setup

### A. Core Domains
In Vercel: **Project → Settings → Domains**:
1. Add `ceyteq.com` (Apex Domain)
2. Add `dashboard.ceyteq.com` (Subdomain for Master Dashboard)
3. Add `*.ceyteq.com` (Wildcard Domain for multi-tenant restaurant menus)

### B. DNS Record Configuration (Cloudflare, GoDaddy, Namecheap, Route 53)

| Type | Name / Host | Value / Target | TTL | Proxy Status (Cloudflare) |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (or `ceyteq.com`) | `76.76.21.21` | Auto / 300 | DNS Only (or Proxied if Full SSL) |
| **CNAME** | `dashboard` | `cname.vercel-dns.com.` | Auto / 300 | DNS Only |
| **CNAME** | `*` (Wildcard) | `cname.vercel-dns.com.` | Auto / 300 | DNS Only |

> **Wildcard Domain Note**: `*.ceyteq.com` routes requests like `ceylonspice.ceyteq.com` or `colombobistro.ceyteq.com` directly to the Next.js multi-tenant middleware, resolving the restaurant tenant by subdomain dynamically.

---

## 5. GitHub CI/CD Integration

### A. Linking Repository
1. In the Vercel Dashboard, click **"Add New..." → "Project"**.
2. Select **GitHub** and grant access to your repository `ceyteq-master-dashboard`.
3. Framework Preset: **Vite / Next.js**.
4. Root Directory: `./` (or directory containing `package.json`).

### B. Automated Deployment Flow
- **Main Branch (`main` / `master`)**: Automatically builds and deploys to **Production Environment**.
- **Pull Requests & Feature Branches**: Automatically builds ephemeral **Preview Deployments** with unique URLs for testing and QA.

### C. Deployment Protection & Production Safety
In **Settings → Deployment Protection**:
1. Enable **Vercel Authentication** or password protection for Preview deployments so staging menus aren't public.
2. Under **Git Settings**, turn on **"Auto-cancel Redundant Deployments"** to save build minutes when developers push consecutive commits.
3. Configure **Ignored Build Step** if you want to skip builds for documentation commits:
   ```bash
   git diff --quiet HEAD^ HEAD ./src ./server.ts ./package.json
   ```
