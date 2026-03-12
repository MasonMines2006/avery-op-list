# AGENTS.md

## Project Overview

**avery-op-list** is a whimsical, medieval-themed "Op List" (Opponents List) web app for a person named Avery. It lets Avery maintain a ranked register of people who have wronged her, written in theatrical old-English prose. The list is publicly readable but only editable by an authenticated user.

---

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18, Vite, CSS Modules                                       |
| Backend    | Express 5 (Node.js, ESM)                                          |
| Data store | Flat JSON file (`server/data.json`)                               |
| Auth       | Password-based; server issues UUID session tokens with 8-hour TTL |
| Dev runner | `concurrently` (runs Vite + Express together)                     |

---

## Project Structure

```
index.html               # Vite HTML entry point
vite.config.js           # Vite config; proxies /api → localhost:3001
package.json
Makefile

server/
  index.js               # Express API server (port 3001)
  data.json              # Persistent flat-file enemy list

src/
  main.jsx               # React entry point
  App.jsx                # Root component — auth state, CRUD logic, rank calculation
  App.module.css
  index.css              # Global styles
  components/
    EditModal.jsx        # Modal for adding / editing an enemy entry
    EditModal.module.css
  pages/
    LoginPage.jsx        # Password gate (medieval-themed)
    LoginPage.module.css
```

---

## API Endpoints (`server/index.js`)

| Method | Path           | Auth     | Description                              |
| ------ | -------------- | -------- | ---------------------------------------- |
| `POST` | `/api/login`   | —        | Submit password; receive a session token |
| `POST` | `/api/logout`  | Required | Invalidate the current token             |
| `GET`  | `/api/enemies` | —        | Fetch the full enemies list (public)     |
| `PUT`  | `/api/enemies` | Required | Replace the entire enemies list          |

Auth is passed via the `x-auth-token` request header. Tokens are stored in an in-memory `Map` on the server and in `localStorage` on the client (`op_token`).

---

## Data Model

Each entry in `server/data.json` looks like:

```json
{
  "id": "uuid-string",
  "rank": 1,
  "name": "Full Name",
  "offense": "Short offense label",
  "description": "Long medieval-prose account of the wrongdoing.",
  "seal": "☠"
}
```

Ranks are **derived from list order** — `App.jsx` recalculates them on every save (`applyAndPersist`). The server stores whatever it receives.

---

## Key Frontend Logic (`src/App.jsx`)

- **`rankLabel(n)`** — Maps rank numbers to titles (#1 = "Most Wanted", #2 = "Grievous Offender", etc.)
- **`NoticeCard`** — Renders a single enemy card with rank badge, seal, name, offense tag, and description. Shows edit controls (move up/down, edit, delete) only in edit mode.
- **`applyAndPersist(updated)`** — Recalculates ranks by index position, updates local state, and `PUT`s to the server.
- **Auth flow** — Token is read from `localStorage` on mount. A `401` response from any mutating call triggers automatic logout.

---

## Running the App

```bash
# Install dependencies
npm install

# Start both the Vite dev server and the Express API
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

The Vite dev server proxies all `/api/*` requests to the Express server.

---

## Environment Variables

| Variable      | Default    | Description                          |
| ------------- | ---------- | ------------------------------------ |
| `OP_PASSWORD` | `avery123` | Login password checked by the server |
| `PORT`        | `3001`     | Port the Express server listens on   |

Set these in a `.env` file at the workspace root.

---

## Coding Conventions

- **ESM throughout** (`"type": "module"` in `package.json`).
- **CSS Modules** for all component styles — class names are scoped per file.
- **No database** — all persistence is a single `writeFileSync` call to `server/data.json`.
- **No test suite** currently exists.
- Tone/copy across the UI is deliberately theatrical and medieval ("Seal & Save", "Speak, Friend, and Enter", etc.) — maintain this voice when adding or editing UI text.
