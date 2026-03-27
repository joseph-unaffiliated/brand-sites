# Start here (non-technical welcome)

This Git repository is **`brand-sites`** on GitHub—the shared home for our **publication websites** (the code that powers each brand’s homepage, articles, and reader flows). Editors usually work in **Sanity** (our content tool); this folder is mainly for engineers and technical partners.

## What lives here

- **`apps/<brand>/`** — one **Next.js** website per publication (e.g. Hookup Lists, The Pickle Report). Each app can have its own design, domain, and Vercel project.
- **`packages/*`** — **shared building blocks**: how email-link redirects work, how we talk to Sanity and to “magic” subscription servers, and how ads/pixels load. Change something here and it can affect **every** site—ask before editing.
- **`subscription-functions-copy/`** — reference **serverless** code for Customer.io / BigQuery / magic links; production deploys for **magic.*.com** often live from this tree (or a sibling repo). Not imported by the marketing sites directly.
- **`studio-hookup-lists/`** — optional Sanity Studio variant; prefer env-driven project IDs (see `docs/ENVIRONMENT.md`).

## Where you probably work day to day

- **Articles and pages in the CMS:** Sanity (your team’s Studio or hosted studio), not this repo.
- **Legal copy / one-off text on the live site:** Often still requires a developer to change the Next app—or you file a ticket with the exact URL and text.

## How to ask for a change

_(Fill in your team’s process: Slack channel, PM tool, etc.)_

## For developers

- **`README.md`** — clone, install, run locally.
- **`AGENTS.md`** — rules for AI coding assistants working in this repo.
- **`docs/ARCHITECTURE.md`** — how requests flow (middleware, magic, profile).
- **`docs/DEPLOYMENT.md`** — Vercel, domains, Cloudflare checklist.
