# Twitter-Feed

Web app for browsing Twitter harvest JSON: **The Atelier / Precision Curator** UI with dashboard, upload, category streams, lazy X embeds, and lightweight analytics.

## App (`web/`)

```bash
cd web
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

- **Data Upload**: drop or select your export JSON (root object with a `posts` array, like `17 Apr 1.json`).
- **Feed Explorer**: pick a curated stream (score keys + tags), search within the list, scroll; tweet embeds load as rows enter view.
- **Dashboard / Analytics**: summaries from the loaded file. Parsed data is stored in **IndexedDB** in your browser so a refresh keeps the last import (no server).

### Deploy (example: Vercel)

1. Create a Vercel project from this repo.
2. Set **Root Directory** to `web` (important: not the repo root).
3. Framework: **Vite** (or Other); build **`npm run build`**, output **`dist`**.
4. Deploy. No API keys are required for the current build.

`web/vercel.json` adds a **SPA fallback** so routes like `/explorer` or `/upload` work on refresh and deep links. Without it, Vercel only serves `index.html` at `/` and other paths can **404**.

If you still see 404 on the **homepage** (`/`), double-check the dashboard: **Root Directory** = `web`, **Output Directory** = `dist`, and that the latest deployment succeeded (build logs show `vite build` completing).

## Sample data

`17 Apr 1.json` in the repo root is an example export for local testing (large file).
