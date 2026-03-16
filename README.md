# avery-op-list

A whimsical, medieval-themed "Opponents List" web app where Avery can maintain a ranked register of people who have wronged her, written in theatrical old-English prose.

## Quick Start

```bash
# Install dependencies
make install

# Start dev servers (Vite + Express)
make dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

## Available Make Targets

Run `make help` to see all available targets:

```
help      Show this help message
install   Install npm dependencies
dev       Start Vite + Express dev servers
build     Build the frontend for production
preview   Preview the production build
```

## Documentation

See [AGENTS.md](AGENTS.md) for comprehensive project documentation including:

- Tech stack overview
- Project structure
- API endpoints
- Data model
- Key frontend logic
- Environment variables
- Coding conventions

## Featuress

- **Public viewing** — Anyone can view the ranked enemies list
- **Password-protected editing** — UUID session tokens (8-hour TTL) gate all mutations
- **Medieval theming** — UI and copy maintain a theatrical old-English aesthetic throughout
- **CRUD operations** — Add, edit, delete, and reorder enemies
- **Auto-ranking** — Rankings are recalculated by position on every save

## Tech Stack

- **Frontend:** React 18, Vite, CSS Modules
- **Backend:** Express 5 (Node.js, ESM)
- **Persistence:** Flat JSON file (`server/data.json`)
- **Auth:** Password-based with UUID session tokens

## Default Credentials

- Default password: `avery123`
- Change via `OP_PASSWORD` environment variable

## Deployment

This app can be deployed with Netlify for the frontend and Render for the API.

### Render backend

Create a new Render Web Service from this repository with these settings:

- Language: `Node`
- Root Directory: leave blank
- Build Command: `npm install`
- Start Command: `npm run server`

Set these environment variables in Render:

- `OP_PASSWORD=replace-me`
- `FRONTEND_ORIGINS=https://your-site.netlify.app`

Optional variables:

- `DATA_DIR=/var/data` if you mount a persistent disk
- `NOTIFY_EMAIL`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_HOST`
- `SMTP_PORT`
- `NOTIFY_WEBHOOK`

Important: the backend currently persists data in JSON files. If Render restarts the service on ephemeral storage, edits can be lost.

- If your Render plan supports a persistent disk, mount one and point `DATA_DIR` at that mount path.
- If not, treat this as temporary storage and move to a database before relying on it in production.

### Netlify frontend

Create a Netlify site from this repository with these settings:

- Build command: `npm run build`
- Publish directory: `dist`

Set this environment variable in Netlify:

- `VITE_API_BASE_URL=https://your-render-service.onrender.com`

The SPA redirect rule for Netlify is included in `public/_redirects`.

### Recommended deploy order

1. Deploy Render first.
2. Copy the Render URL into Netlify as `VITE_API_BASE_URL`.
3. Deploy Netlify.
4. Copy the Netlify URL into Render as `FRONTEND_ORIGINS`.
5. Redeploy Render if needed.
