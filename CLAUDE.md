# sPark Web — Claude Code governance

Next.js 15 App Router (Turbopack in dev). Port 3000 by default (`.env` may override —
local dev currently uses 3011).

This repo is **self-contained**: its own lockfile, `node_modules`, pinned
`packageManager` and CI. Cloning it alone is enough to install, build and deploy. Nothing
resolves upward into the `spark-parking` umbrella repo.

## Layout

```
src/app/         — App Router routes; (auth), (dashboard) and (admin) groups
src/components/  — React components
src/lib/         — server actions, API client, schemas
messages/        — next-intl translation catalogues
vendor/ui        — shared design tokens and components
vendor/types     — shared TypeScript types, zero runtime dependencies
vendor/config    — shared tsconfig and eslint bases
```

`vendor/*` are pnpm workspace members (see `pnpm-workspace.yaml`), linked with
`workspace:*`. `pnpm run build` and `dev` run `pnpm -r run build` first, so `vendor/types`
then `vendor/ui` compile before Next starts. Both are listed in `transpilePackages`.

### vendor/types is duplicated with apps/api

`vendor/types` exists in both this repo and the api repo, deliberately, so neither depends
on the other. It is the one contract that can silently drift. When you change auth roles,
the password policy, or payment/booking status shapes here, make the same change in
`saprk-parking-api`'s `vendor/types` in the same PR.

## BFF pattern

The browser only ever talks to this Next origin — it never calls the API directly. Server
actions and route handlers hold the session and forward to the API server-side.

- Session lives in an `iron-session` cookie. Never expose the API token to the client.
- `connect-src` in the CSP is `'self'` plus the Google Maps origins, and should stay that
  way; widening it usually means something is calling the API from the browser.
- Admin pages send `Cache-Control: no-store` (see `next.config.ts`) because they carry
  tenant lifecycle and audit data — never let a shared machine's browser serve them back
  after logout.

Security headers (CSP, HSTS, frame-ancestors, Permissions-Policy) are defined centrally in
`next.config.ts`. Changing them is security-sensitive; explain WHY in the diff.

## Coding standards

- TypeScript strict mode everywhere. No `any` without explicit justification.
- No comments unless the WHY is non-obvious.
- Zod for all external input validation (form payloads, route params, API responses that
  cross a trust boundary).
- No `console.log` in production paths.
- `type-imports` enforced: `import type { Foo }` for type-only imports.
- Server Components by default; add `'use client'` only where interactivity needs it.

## i18n

Translations live in `messages/`. `pnpm run check:i18n` enforces key parity between
locales and runs in CI — a missing key in one locale fails the build, so add keys to every
catalogue in the same change.

## Module boundary rules

- `vendor/*` must not import from `src/`. Dependencies point one way only.
- `vendor/types` must have zero runtime dependencies.
- `vendor/ui` depends only on `@spark/types` and `react`.
- Never reach outside this repo.

## Implementation workflow

1. **Evaluate** — scope, inputs/outputs, affected routes, edge cases; find the security
   surface (session handling, authorization, PII in payloads) and the performance surface
   (waterfalls, over-fetching, client bundle weight).
2. **Search existing patterns** — grep before designing; check `vendor/ui` for an existing
   component and `src/lib` for an existing action or schema. Never reinvent what exists.
3. **Design** — simplest approach that satisfies correctness, security, performance. Write
   the plan as a task list before touching files.
4. **Implement** — follow the plan, no scope creep. One concern per file. No dead code, no
   TODO comments, no half-finished stubs.

Use `opus` for auth/session, payment or authorization-shaped work; `sonnet` for standard
UI and route work; `haiku` only for pure read/search.

## Local setup

```bash
pnpm install
cp .env.example .env
# fill in NEXT_PUBLIC_MAP_PROVIDER and the matching map key, plus NEXT_PUBLIC_API_URL
pnpm run dev
```

The API must be running for anything past the login screen to work.

## Env var conventions

| Prefix         | Visibility                                  |
| -------------- | ------------------------------------------- |
| (none)         | Server-side only — safe for secrets         |
| `NEXT_PUBLIC_` | **Inlined into the client bundle at build** |

Never expose a service role key or private key via `NEXT_PUBLIC_`. Because
`NEXT_PUBLIC_*` values are baked in at build time, they must be present as build args in
the Dockerfile, not just at runtime.

## Deploy

`Dockerfile` builds from this repo alone — no monorepo context — and uses Next's
`standalone` output. CI builds the image on every run so a broken Dockerfile fails the PR
rather than the deploy.

Deployed on Vercel, using its own native Git integration — a push to `main` builds and
deploys on Vercel's infrastructure directly, with no gate on GitHub Actions' `ci` job.
`vercel.json`'s `buildCommand` (`pnpm run build`) is what makes that build work at all,
since Vercel's zero-config Next.js detection otherwise runs `next build` directly and
never compiles `vendor/*` first.

A CI-gated deploy (GitHub Actions `deploy` job triggering Vercel only after `ci` passed)
was built and then deliberately removed. Two approaches were tried and both hit dead
ends worth knowing about if this is revisited:

- **Deploy Hook** (`curl -X POST` a hook URL from the `deploy` job): the hook reliably
  returned `201`/`PENDING` from Vercel's API — confirmed by curling it manually with the
  exact current hook URL — but no deployment ever appeared in the Deployments tab, and
  nothing surfaced anywhere to explain why.
- **Vercel CLI** (`vercel pull` / `vercel build` / `vercel deploy --prebuilt` from the
  runner, authenticated with `VERCEL_TOKEN`): `vercel pull` failed with "Could not
  retrieve Project Settings" for every token that could be created. Root cause (see
  [vercel/vercel#17506](https://github.com/vercel/vercel/issues/17506), open): the CLI
  internally calls `GET /teams/{teamId}` and treats a 403 there as fatal, even though the
  actual project fetch it needs succeeds — and a **project-scoped** token (the
  narrower, safer option) is always forbidden from that call. Only a **team-scoped**
  token — full access to every project under the team, not just this one — works around
  it, which was judged not worth the broadened credential for what this fixes.

Next infers its workspace root from the lockfile. Running dev/build from inside the
umbrella repo puts a second lockfile above this one and Turbopack warns that the root is
ambiguous; it is cosmetic and does not occur for a standalone clone. Do not "fix" it by
pinning `turbopack.root` to this directory — pnpm symlinks `node_modules` out to the
umbrella's store in that layout, and Turbopack refuses to follow symlinks outside a pinned
root, which breaks module resolution entirely.

## Definition of done

- [ ] Feature acceptance criteria implemented
- [ ] `pnpm run lint && pnpm run typecheck && pnpm run check:i18n` all pass
- [ ] `pnpm run build` succeeds
- [ ] No secrets introduced, nothing sensitive moved into a `NEXT_PUBLIC_` var
- [ ] Security-sensitive changes (session, CSP, admin routes) reviewed by a fresh subagent
- [ ] `.env.example` updated if new env vars added
- [ ] `vendor/types` change mirrored into `saprk-parking-api` if the contract moved

## Branch and commit discipline

- Feature branches off `main`.
- Commits: `type(scope): message` — e.g. `feat(admin): add tariff editor`.
- No direct pushes to `main`.
- All PRs require passing CI.
