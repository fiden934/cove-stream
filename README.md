# COVE — Backend

Netlify Functions backend for COVE streaming platform.
TMDB API key stays hidden server-side. Frontend never sees it.

---

## Deploy to Netlify

### Option A — GitHub (recommended)
1. Push this folder to a GitHub repo
2. Go to app.netlify.com → New site → Import from GitHub
3. Build settings are auto-detected from `netlify.toml`
4. Add environment variable: `TMDB_API_KEY` = your key
5. Deploy

### Option B — Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## Environment Variables

Set this in Netlify → Site Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `TMDB_API_KEY` | your TMDB API key |

---

## API Routes

All routes are prefixed with `/api/`

### Search
```
GET /api/search?q=inception
GET /api/search?q=breaking+bad&type=tv
GET /api/search?q=avengers&type=movie&page=2
```
`type` = `multi` (default) | `movie` | `tv`

---

### Movies
```
GET /api/movie?id=299534              → movie details + cast + trailer
GET /api/movie?action=trending        → trending this week
GET /api/movie?action=popular         → popular movies
GET /api/movie?action=top_rated       → top rated
GET /api/movie?action=nowplaying      → now playing
GET /api/movie?action=popular&page=2  → paginate
```

Response includes `embed_url` — ready to drop into an iframe:
```
https://www.vidking.net/embed/movie/{tmdbId}
```

---

### TV Shows
```
GET /api/tv?id=1396                      → full show details + seasons list
GET /api/tv?id=1396&season=1             → season details + all episodes
GET /api/tv?id=1396&season=1&episode=1   → single episode + embed URL
GET /api/tv?action=trending              → trending TV this week
GET /api/tv?action=popular               → popular TV shows
GET /api/tv?action=top_rated             → top rated TV
```

Episode response includes `embed_url`:
```
https://www.vidking.net/embed/tv/{id}/{season}/{episode}?autoPlay=true&nextEpisode=true&episodeSelector=true
```

---

### Genres
```
GET /api/genres?type=movie   → movie genre list
GET /api/genres?type=tv      → TV genre list
```

---

## Player Embed Parameters (vidking.net)

| Param | Type | Description |
|-------|------|-------------|
| `color` | string | Hex color without # (e.g. `c8a44a`) |
| `autoPlay` | boolean | Auto-start playback |
| `nextEpisode` | boolean | Show next episode button (TV only) |
| `episodeSelector` | boolean | Episode selection menu (TV only) |
| `progress` | number | Start time in seconds |

---

## Project Structure

```
cove-stream/
├── netlify/
│   └── functions/
│       ├── search.js    ← /api/search
│       ├── movie.js     ← /api/movie
│       ├── tv.js        ← /api/tv
│       └── genres.js    ← /api/genres
├── public/
│   └── index.html       ← placeholder (replace with your frontend)
├── netlify.toml
└── package.json
```
