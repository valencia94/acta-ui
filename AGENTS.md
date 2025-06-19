# AGENTS Instructions

## Scope
This file applies to the entire repository.

## Development
- Install dependencies with `pnpm install --frozen-lockfile`.
- Run `pnpm run lint` and ensure it passes.
- Run `pnpm run build` and confirm the build succeeds.
- Before running `scripts/smoke_ui.sh`, export `VITE_API_BASE_URL` to the API endpoint.
- All pull requests must include the results of lint, build, and smoke tests in the PR description.

## Scripts
- `scripts/smoke_ui.sh` should be executable (`chmod +x`).
- `scripts/deploy-to-s3.sh` should remain executable and contain the commands to sync S3 and invalidate CloudFront.
