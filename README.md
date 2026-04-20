# NodeAutomation (n8n fork)

Short notes for **local development**: stopping all related processes and running **watch** mode (backend + frontend).

## Stop everything (API, Vite, Storybook, …)

On macOS, free the usual dev ports:

```bash
for p in 5678 8080 6006 7655; do
  lsof -nP -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null
done
```

- **5678** — n8n API (`packages/cli`)
- **8080** — Editor UI / Vite (`packages/frontend/editor-ui`)
- **6006** — Storybook (if you run `turbo` with `@n8n/storybook`)
- **7655** — Computer-use gateway (if used)

If something is still bound, inspect and stop manually: `lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(5678|8080|6006|7655)\s'`.

## Run watch mode (recommended: two terminals)

The editor calls the API at `http://localhost:5678/`, so you need **both the backend and Vite**.

### 1) Backend — TypeScript watch + nodemon

```bash
cd packages/cli
pnpm dev
```

Wait for a log line like `n8n ready … port 5678`.

### 2) Frontend — Vite dev (HMR / watch)

```bash
cd packages/frontend/editor-ui
pnpm dev
```

Open **http://localhost:8080/** — `VUE_APP_URL_BASE_API` points the API at port 5678 (see the `serve` script in `package.json`).

### Why does **http://localhost:5678** still show an “old” UI?

The backend does not proxy to Vite. Port **5678** serves **static files** from **`n8n-editor-ui/dist`** (output of `pnpm build`), not the sources you are editing.

| Approach | Always the latest UI? |
|----------|------------------------|
| Work on **http://localhost:8080** (Vite `pnpm dev`) | Yes — HMR; changes show up immediately |
| Only open **5678** | No — you only see the **last `pnpm build`** in `editor-ui/dist` |

If you **must** see a fresh UI on **5678** (single URL, production-like): after changing code, build the editor and restart the API:

```bash
cd packages/frontend/editor-ui && pnpm build
# stop whatever is holding 5678, then:
cd packages/cli && pnpm dev
```

## One command from the repo root (optional)

Editor UI only via Turbo:

```bash
pnpm dev:fe:editor
```

You still need a separate terminal running `packages/cli` as above, unless the API is already running elsewhere.

## Notes

- `pnpm dev` at the **repo root** runs Turbo and pulls in **many** packages (Storybook, Playwright, …). For a lighter daily UI workflow, the two commands above are usually enough.
- Editing **`@n8n/design-system`**: the Vite editor usually resolves aliases to source; if changes do not show up, check `vite.config.mts` and `AGENTS.md` in the repo.
