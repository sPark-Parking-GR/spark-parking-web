# Web versioning — options (not implemented)

Status: **undecided, nothing built.** Mobile already takes its app version from the git tag
(`v1.2.0` → `1.2.0`, see `spark-parking-mobile/.github/workflows/release.yml`). Web has no
equivalent: `package.json` says `0.0.1`, nothing in `src/` displays a version, and
`vercel.json` only sets the build command.

The constraint: **Vercel does not read git tags.** It builds a branch or commit, so a tag
cannot reach the build on its own. Any tag-driven version needs something to carry it in.

## Option 1 — a tag workflow drives the Vercel deploy

**Already tried and removed — see the Deploy section of `CLAUDE.md`.** `vercel pull` fails
with "Could not retrieve Project Settings" for any project-scoped token
([vercel/vercel#17506](https://github.com/vercel/vercel/issues/17506)); only a team-scoped token
works, which was judged too broad a credential. A Deploy Hook is no substitute: it cannot
carry a version, and it silently produced no deployments. Revisit only if that issue is fixed.

A GitHub Action on `v*` tags deploys through the Vercel CLI and passes the version as a
build env var, the same shape as mobile.

```yaml
on:
  push:
    tags: ['v*']
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g vercel
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          NEXT_PUBLIC_APP_VERSION: ${{ github.ref_name }}
      - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

- Needs GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Production deploys must move off Vercel's git integration (disable auto-deploy for the
  production branch), or each push to it deploys twice and the untagged one has no version.
- The tag is the single source of truth, and a production deploy is a deliberate act.
- Cost: a second deploy path to maintain, and a Vercel token living in GitHub.
- Status: blocked by the token-scope issue above.

## Option 2 — keep Vercel's git deploys, stamp the version at build time

`next.config.ts` exposes the version, and every deploy stays traceable to a commit.

```ts
import pkg from './package.json'

env: {
  NEXT_PUBLIC_APP_VERSION: pkg.version,
  NEXT_PUBLIC_APP_COMMIT: (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7),
}
```

(`VERCEL_GIT_COMMIT_SHA` is a Vercel system env var; enable "Automatically expose System
Environment Variables" in the project settings.)

`package.json`'s `version` is kept in step with the tag by a release step, for example
`pnpm version 1.2.0 --no-git-tag-version` committed before tagging, or a workflow on `v*`
tags that opens a bump PR.

- No change to how production deploys, and no new secrets.
- The tag does not drive the deploy, so the version can drift from the tag if the bump is
  forgotten. The commit SHA shown next to it is the reliable identifier.

## Either way

- Show it somewhere: a footer or settings line such as `v1.2.0 (a1b2c3d)`. Not displayed
  today.
- It is a client-safe value, so `NEXT_PUBLIC_` is correct. Add it to `.env.example` if it is
  ever read outside Vercel.
- Keep the `src/` display behind a small helper with a test, as mobile does with
  `describeBuild`.

## Recommendation

Option 2. Option 1 is blocked today (see above), and Vercel's native git integration is the
intended deploy path.
