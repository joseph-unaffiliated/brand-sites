# brand-sites

Monorepo for **publication marketing sites** (Next.js) plus shared packages. This repo is **`brand-sites`** on GitHub. Internal npm packages still use the scope **`@publication-websites/*`** (name in `packages/*/package.json`); that is unrelated to the Git repo name.

**New here and not a developer?** Read **[STARTHERE.md](./STARTHERE.md)** first.

## Quick start

Requirements: **Node 20+**, **pnpm** (`corepack enable && corepack prepare pnpm@9.15.0 --activate`).

```bash
pnpm install
pnpm dev
```

By default Turbo runs `dev` for all apps; run one site:

```bash
pnpm exec turbo dev --filter=hookuplists
# or
pnpm exec turbo dev --filter=thepicklereport
```

**Hookup Lists** local env: copy [`apps/hookuplists/.env.local.example`](apps/hookuplists/.env.local.example) to `apps/hookuplists/.env.local`.

## Layout

| Path | Purpose |
|------|---------|
| `apps/hookuplists` | Hookup Lists production site |
| `apps/thepicklereport` | Second publication template |
| `packages/*` | `@publication-websites/*` shared code |
| `subscription-functions-copy` | Magic / BigQuery / CIO serverless (reference + deploy) |
| `studio-hookup-lists` | Optional Sanity studio (env-driven project id) |
| `docs/` | Architecture, env, deployment |

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — data flow, middleware, profile tokens  
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — env vars  
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Cloudflare  
- [docs/MAGIC_READER_ENV.md](docs/MAGIC_READER_ENV.md) — magic `READER_TOKEN_SECRET` + `READERS_CORS_ORIGINS`  
- [docs/THEPICKLEREPORT_LAUNCH_GUIDE.md](docs/THEPICKLEREPORT_LAUNCH_GUIDE.md) — full Pickle setup with copy/paste values  
- [AGENTS.md](AGENTS.md) — rules for contributors / AI agents  

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | All workspaces `dev` (persistent) |
| `pnpm build` | `turbo build` all packages that define build |
| `pnpm lint` | `turbo lint` |
