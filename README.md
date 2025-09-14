Latent Library Admin – Next.js 14 (App Router)

Stack: Next.js + TypeScript + Tailwind (v4) + shadcn/ui, Supabase JS, AWS SDK v3 (S3 presigned URLs).

What it does
- Password-gated `/admin` with an images gallery from the `images` table in Supabase
- Each card shows a signed S3 URL thumbnail, filename, bytes, dimensions, format, and created time
- Search, filters (status, format, NSFW), sort, and infinite scroll

Getting started
1) Install dependencies
```bash
pnpm install
```

2) Create `.env.local` at project root
```bash
NEXT_PUBLIC_APP_NAME="Latent Library Admin"
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE=your-service-role-key
AWS_REGION=eu-central-1
AWS_S3_PUBLIC_ENDPOINT=https://s3.eu-central-1.amazonaws.com
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
ADMIN_PASSWORD=change-me
S3_DEFAULT_BUCKET=latent-library
PAGE_SIZE=60
SIGNED_URL_TTL_SECONDS=900

# CDN Configuration (optional)
CLOUDFRONT_DOMAIN=your-distribution-id.cloudfront.net
BUNNY_CDN_HOSTNAME=latent-library.b-cdn.net
```

3) Run dev
```bash
pnpm dev
```

Auth and middleware
- `/login` posts to `/api/login` and sets a `admin=1` HttpOnly cookie (24h)
- `middleware.ts` protects `/admin` and `/api/images`

API
- `/api/images` (GET) accepts `q`, `status`, `format`, `nsfw`, `sort`, `cursor`, `limit`
- Attaches presigned URLs using AWS SDK v3; secrets never reach the browser

Notes
- Page size defaults to `PAGE_SIZE` env (60)
- If signing fails, a placeholder is shown and metadata still renders
- Future controls for `is_public` and `tags` are present but disabled

License
MIT
