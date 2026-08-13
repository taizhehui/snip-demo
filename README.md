# Snip

A tiny URL shortener that demonstrates **one backend, two very different clients** —
a web app and a terminal CLI — consuming one identical HTTP contract.

Each layer of the app lives on its **own orphan branch** of this same repo (independent
history, files at the branch root). The `main` branch is a **superproject** that mounts
those branches as **submodules**, so a full checkout materializes the whole app side by
side.

## Architecture

```
one repo ──┬── backend    Bun API server (zero deps, in-memory Map)
           ├── frontend   Angular 19 web app
           ├── cli        zero-dep Node CLI
           └── main       superproject: .gitmodules mounting the three above
```

| Path | Branch | Tech | Role |
| --- | --- | --- | --- |
| `backend/` | `backend` | Bun | HTTP API + redirects |
| `frontend/` | `frontend` | Angular 19 | Web client |
| `cli/` | `cli` | Node (CommonJS) | Terminal client |

## API contract

The backend serves this contract; both clients depend on it.

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/api/links` | `{ "url": "https://…" }` | `201 { code, url, shortUrl, hits, createdAt }` · `400` on invalid JSON / non-http(s) URL |
| GET | `/api/links` | — | `200` array of all links |
| GET | `/:code` | — | `302` to the original URL (+1 hit) · `404` if unknown |

Storage is an in-memory `Map` — restarting the backend clears all links, by design.

## Clone

Submodules are empty on a plain clone. Always recurse:

```
git clone --recurse-submodules https://github.com/taizhehui/snip-demo.git
```

Already cloned without submodules? Populate them:

```
git submodule update --init --recursive
```

## Run all three pieces

From a `main` checkout with submodules populated, use three terminals:

```
cd backend  && bun start                 # :3000  API + redirects
cd frontend && npm install && npx ng serve   # :4200  web UI (talks to :3000)
cd cli      && node cli.js ls            # terminal client, same backend
```

## Update workflow

Each layer is edited on its own branch, then the superproject pointer is bumped:

1. Edit inside the submodule folder, then commit + push **there** (advances that branch):

   ```
   cd backend
   git add -A && git commit -m "…" && git push
   cd ..
   ```

2. In the superproject, move the pointer to the new tip and commit the bump:

   ```
   git submodule update --remote backend
   git add backend
   git commit -m "Bump backend submodule"
   git push
   ```

The layer commit and the pointer commit are separate records — that extra step is what
keeps `main` a pinned, reproducible snapshot of the whole app.
