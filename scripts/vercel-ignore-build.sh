#!/usr/bin/env bash
# Vercel's "Ignored Build Step" (Project Settings -> Git -> Ignored Build Step):
# exit 0 skips this build, any other exit code lets it proceed.
#
# Production deploys (branch main) are triggered exclusively by the deploy job in
# .github/workflows/ci.yml, after the ci job passes — never by Vercel's own git-push
# trigger — so a broken commit can never reach production ahead of CI. Every other
# ref (PRs, feature branches) still builds immediately here, so preview deployments
# stay fast.
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "Skipping Vercel's own build for main — production deploys are triggered by GitHub Actions after CI passes."
  exit 0
fi

echo "Building preview deployment for $VERCEL_GIT_COMMIT_REF"
exit 1
