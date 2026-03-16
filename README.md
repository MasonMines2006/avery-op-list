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
