# Family Dashboard

Wall-display dashboard with calendar, shared grocery list, and TV show tracking.

- **GitHub Pages** hosts the dashboard and TV Tracker
- **Cloudflare Workers KV** stores shared groceries and TV favorites

See **[DEPLOY.md](DEPLOY.md)** for full setup instructions.

## Quick local use

1. Double-click `Start Family Dashboard.bat`
2. Press **S** for settings

## Online use

1. Deploy `worker/` to Cloudflare (see DEPLOY.md)
2. Push this repo to GitHub and enable Pages
3. Enter your Worker URL + family password in dashboard Settings
4. Open `/tv/` to manage show favorites

## Family features

- **Grocery list** — anyone can add items from the main page; syncs via Cloudflare
- **TV tonight** — today's episodes from your favorites in the week banner
- **TV this week** — upcoming favorite episodes for the next 7 days
