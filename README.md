# WST Member Frontend

React + Vite frontend for the WST Member portal.

This app connects to the custom PHP API and provides:
- Auth flows (login, signup, forgot password with OTP)
- Dashboard and resources
- Resource launch workspace
- Transactions, settings, FAQ, help desk

## Tech Stack

- React 19
- React Router
- Zustand (client-side cache/store)
- Tailwind CSS (via `@tailwindcss/vite`)
- Vite

## Project Structure

```text
frontend/
  src/
    Auth/                 # Login/Signup/Forgot password pages
    components/           # Shared UI + layout components
    context/              # Auth context/provider
    lib/                  # API client + API methods
    pages/                # Protected app pages
    store/                # Zustand store (memberStore)
    App.jsx               # Route definitions
    main.jsx              # App bootstrap
```

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)

## Environment

Create `.env` in this folder:

```env
VITE_API_BASE_URL=https://app.webstacktool.com/apis/api/v1
```

Notes:
- Do not add trailing slash.
- Frontend sends requests like `${VITE_API_BASE_URL}/auth/login/start`.

## Run Locally

```bash
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## State and Caching

`src/store/memberStore.js` uses Zustand for cache-first loading:
- Dashboard + resources cache
- Resource launch payload cache
- Payments + invoice/access cache

This reduces repeated API calls and improves page switching speed.

## API Expectations

The frontend expects the PHP API base path to expose endpoints under:
- `/health`
- `/auth/*`
- `/dashboard`
- `/resources`
- `/resources/launch/{resource_id}`
- `/payments`
- `/invoice/access`
- `/profile/*`

## Deployment Notes

- Build output is generated in `frontend/dist`.
- Serve `dist` behind your web server/CDN.
- Make sure API CORS allows your frontend origin.
