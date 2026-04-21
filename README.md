# Twitter-Feed

Web app for browsing Twitter harvest JSON: **The Atelier / Precision Curator** UI with dashboard, upload, category streams, lazy X embeds, and lightweight analytics.

## What you need on your computer

- **Node.js 20 or newer** (22 LTS is ideal). Check with `node -v`.
- **npm** (comes with Node). Check with `npm -v`.

If Node is missing, install it from [https://nodejs.org](https://nodejs.org) or use a version manager such as [nvm](https://github.com/nvm-sh/nvm).

## Run it locally (development)

From the **root of this repository** (the folder that contains `web/`):

```bash
cd web
npm install
npm run dev
```

Your terminal will show a local URL, usually **http://localhost:5173**. Open that in your browser.

- **Data Upload**: drop or select your export JSON (root object with a `posts` array, like `17 Apr 1.json` in this repo).
- **Feed Explorer**: pick a stream, search, scroll; tweet embeds load as rows enter view. **Saved** tweets can include a **note** (stored in IndexedDB with the bookmark). **Forever** (keep icon) stores a **copy of the tweet** in a separate IndexedDB database so pins **survive new JSON uploads** and are available even with no archive loaded; remove with **keep_off** in the Forever view or **Clear all Forever pins** on the Dashboard. **Trash** can be emptied (restore to feed) or **purged from archive** (removes those posts from the in-memory export and clears trash). On desktop: **hold** the floating up/down buttons to scroll the feed quickly; **compact density** and **2–3 column** grid show more at once; toggle **light/dark** for X embeds; **back to top** in the header. Sidebar minimize uses **sessionStorage**.
- **Dashboard**: **Clear local data** removes the current archive and session bookmarks from this browser (Forever pins are **not** cleared—use **Clear all Forever pins**). Then routes to upload.
- **Dashboard / Analytics**: summaries from the loaded file. Parsed data is stored in **IndexedDB** in your browser so a refresh keeps the last import (no backend server).

### Vercel and GitHub

If the Vercel project is connected to your GitHub repo, **pushing to the branch Vercel watches** (usually `main`) triggers a **new deployment automatically**. You can also click **Redeploy** in the Vercel dashboard. Production URL updates after the build finishes.

To stop the dev server, press **Ctrl+C** in the terminal.

## Run the production build locally (optional check)

```bash
cd web
npm install
npm run build
npm run preview
```

Then open the URL Vite prints (often **http://localhost:4173**). This is the same static output you would host.

## Host it on your own server

This app is **static files** after `npm run build` (the `web/dist` folder). You only need a web server that can serve files and rewrite unknown paths to `index.html` (for React Router).

### Option A: Docker (good default if you like containers)

From the **repository root** (where `Dockerfile` lives):

```bash
docker compose up --build
```

Then visit **http://localhost:8080** on the machine where Docker is running.

- Put a reverse proxy with HTTPS (Caddy, nginx, Traefik, or your cloud load balancer) in front of that port for a public site.
- To run on a different host port, change `8080:80` in `docker-compose.yml`.

### Option B: Copy `web/dist` to any static host

1. On a machine with Node, run:

   ```bash
   cd web
   npm ci
   npm run build
   ```

2. Upload the contents of **`web/dist`** to your server (S3 + CloudFront, Netlify, GitHub Pages, a VPS `/var/www/...`, etc.).

3. Configure the host so **all routes** fall back to `index.html` (SPA mode). Without that, refreshing on `/explorer` may 404.

### Option C: Managed host (minimal ops)

Examples: **Vercel**, **Netlify**, **Cloudflare Pages**.

1. Connect this GitHub repository.
2. Set the project **root directory** to **`web`**.
3. Build command: **`npm run build`**.
4. Output directory: **`dist`**.
5. Deploy. No API keys are required for the current build.

## Can someone “just host it for you” from here?

Not directly. This environment can build the app and give you the files or Docker image recipe, but **your** server, DNS, and HTTPS certificates live in **your** accounts. Use one of the options above on infrastructure you control.

`web/vercel.json` adds a **SPA fallback** so routes like `/explorer` or `/upload` work on refresh and deep links. Without it, Vercel only serves `index.html` at `/` and other paths can **404**.

If you still see 404 on the **homepage** (`/`), double-check the dashboard: **Root Directory** = `web`, **Output Directory** = `dist`, and that the latest deployment succeeded (build logs show `vite build` completing).

## Sample data

`17 Apr 1.json` in the repo root is an example export for local testing (large file).
