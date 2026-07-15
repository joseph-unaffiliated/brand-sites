# Hipspeak — Sanity Studio

Content studio for [hipspeak.com](https://hipspeak.com). One `slangEntry` document per Dictionary of Slang email issue.

## First-time setup

1. Create a Sanity project (or use the project id wired in `sanity.config.ts`).
2. `npm install`, then `npm run dev`.
3. `npx sanity deploy` — host `hipspeak`.
4. Set `NEXT_PUBLIC_SANITY_PROJECT_ID` on the Vercel project for `apps/hipspeak`.
5. CORS: `http://localhost:3006` and `https://hipspeak.com`.
