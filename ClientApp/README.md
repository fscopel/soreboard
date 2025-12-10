# Soreboard

A Vite + React scoreboard with modular widgets (weather, sales, events).

## Events Module Setup

The `events` module reads public event feeds (RSS/ICS via an RSS-to-JSON proxy) and refreshes every minute.

- Configure feeds in `.env` using `VITE_EVENTS_FEEDS` as a comma-separated list.
- Use the rss2json proxy format to avoid CORS issues:

Example `.env` line:
```
VITE_EVENTS_FEEDS=https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fexample.com%2Fevents.rss,https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fanother.com%2Fcalendar.rss
```

Tips:
- URL-encode the original RSS URL value in the `rss_url` param.
- Prefer local sources around Brea, CA (city calendar, nearby venues). The module filters by text match ("Brea", "92821", "Orange County").
- ICS feeds may need a converter service that outputs JSON; otherwise, provide an RSS URL.

## Weather Module

- Uses Open-Meteo for Newport Beach, CA.
- Displays temperature (°F), condition, wind (mph), humidity (%).
- Auto-refreshes every minute.

## Development

- Copy `.env.example` to `.env` and fill values.
- Start dev server:

```powershell
$env:VITE_EVENTS_FEEDS = "https://api.rss2json.com/v1/api.json?rss_url=<ENCODED_RSS>"; npm run dev
```

