## Ager Web

Next.js app (App Router) for the Ager frontend.

## Setup

### 1) Install dependencies

```bash
npm ci
```

### 2) Environment variables

Create `.env.local` (not committed) based on `.env.example`.

Required:

- `NEXT_PUBLIC_API_BASE_URL` - backend API base URL (exposed to the browser)

Recommended:

- `API_BASE_URL` - backend API base URL used by Next route handlers (server-only)

### 3) Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)

1) Push this repo to GitHub
2) Import the project in Vercel
3) Set the environment variables in Vercel:

- `NEXT_PUBLIC_API_BASE_URL` = your production backend URL
- `API_BASE_URL` = your production backend URL

Build command: `npm run build`
Output: Next.js default
