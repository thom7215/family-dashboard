# TV Tracker

Browse TV shows, save favorites, and get browser notifications when new episodes air.

**No account or API key needed** — uses the free [TVMaze](https://www.tvmaze.com/api) API.

## Quick start

Double-click **`Start TV Tracker.bat`** in this folder.

Or from the command line:

```bash
cd C:\Users\thom7\Desktop\tv-tracker
npm install
npm run dev
```

Opens at http://localhost:5174

## Features

| Feature | Description |
|---------|-------------|
| **Airing today** | US shows with episodes scheduled for today |
| **On this week** | US shows airing over the next 7 days (optional favorites filter) |
| **Search** | Find any show by name |
| **Favorites** | Star shows to track them (saved in your browser) |
| **Notifications** | Browser alerts when a favorite has a new episode today, tomorrow, or just aired |

## Notifications

Click **Enable notifications** in the header. The app checks favorites every 30 minutes (and on load).

## Family Dashboard

Favorites sync to the **Family Dashboard** when its proxy is running (`Start Family Dashboard.bat` on your Desktop). Starred shows appear in the **TV This Week** panel with episode dates and times.

## Data

Show and episode data from [TVMaze](https://www.tvmaze.com/). Not affiliated with TVMaze.
