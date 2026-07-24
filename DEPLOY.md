# Deploy to GitHub Pages + Cloudflare

Host the dashboard and TV Tracker on **GitHub Pages**, with shared groceries and TV favorites stored in **Cloudflare Workers KV**.

## Overview

| Piece | Where it runs |
|-------|----------------|
| Family Dashboard | GitHub Pages (`index.html`) |
| TV Tracker | GitHub Pages (`/tv/`) |
| Shared data (groceries, favorites) | Cloudflare Worker + KV |
| Calendar and TVMaze proxy | Same Cloudflare Worker |

## 1. Push to GitHub

Copy TV Tracker into this repo, then:

```bash
cd C:\Users\thom7\Desktop\family-dashboard
git init
git add .
git commit -m "Family dashboard with Cloudflare sync"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/family-dashboard.git
git push -u origin main
```

## 2. Enable GitHub Pages

1. GitHub repo - Settings - Pages
2. Source: GitHub Actions
3. Push to main - the workflow builds TV Tracker and deploys both pages

Site URL: `https://YOUR_USERNAME.github.io/family-dashboard/`

## 3. Deploy the Cloudflare Worker

```bash
cd worker
npm install
wrangler login
wrangler kv namespace create DATA
```

Put the KV `id` in `worker/wrangler.toml`, then:

```bash
wrangler secret put FAMILY_TOKEN
wrangler deploy
```

## 4. Configure the dashboard

1. Open your GitHub Pages URL
2. Press S for Settings
3. Set Cloud API URL, Family password, Calendar proxy (`https://YOUR-WORKER.workers.dev/api/ics?url=`), and iCal URL
4. Save

## 5. Configure TV Tracker

Open `/tv/` on your Pages site, open Sync settings, enter the same API URL and password, then star shows.

## Family features

- Grocery list: add from the main page; syncs every 2 minutes
- TV tonight: today's favorite episodes in the banner and TV panel
- TV this week: favorite episodes for the next 7 days
