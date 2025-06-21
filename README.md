# ViteJS React TypeScript Template

[![Dependencies Update](https://github.com/cTux/vitejs-react-ts-template/actions/workflows/dependencies-update.yml/badge.svg)](https://github.com/cTux/vitejs-react-ts-template/actions/workflows/dependencies-update.yml)
[![Lint & Test & Build](https://github.com/cTux/vitejs-react-ts-template/actions/workflows/lint-test-build.yml/badge.svg)](https://github.com/cTux/vitejs-react-ts-template/actions/workflows/lint-test-build.yml)

[![Wallaby.js](https://img.shields.io/badge/wallaby.js-configured-green.svg)](https://wallabyjs.com)

## Template's core:

- [Node.js](https://nodejs.org/en/) (How to switch to [Bun](./docs/BUN.md)?)
- [pnpm](https://pnpm.io/)
- [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)

## Production bundle includes:

- [ReactJS](https://reactjs.org/)
- [Material UI](https://mui.com/material-ui/getting-started/) + [Styled Components](https://styled-components.com/)

## Development dependencies:

- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Husky](https://www.npmjs.com/package/husky) + hooks:
  - pre-commit: lint and test
  - commit-msg: conventional commit message
- [Storybook](https://storybook.js.org/)
- Deployment to S3 and CloudFront via [`deploy_ui.yml`](.github/workflows/deploy_ui.yml)

## Deployment

The GitHub Actions workflow `deploy_ui.yml` requires the repository secret
`VITE_API_BASE_URL` during the build step. Make sure this secret is configured for
both the **staging** and **production** environments.

For deployment to AWS the workflow expects these additional secrets:

- `AWS_ROLE_ARN` – IAM role assumed via OIDC
- `AWS_REGION` – the target AWS region
- `S3_BUCKET_NAME` – destination S3 bucket
- `CLOUDFRONT_DIST_ID` – CloudFront distribution to invalidate

## Environment variables

Copy `.env.example` to `.env` (e.g. `cp .env.example .env`) and set
`VITE_API_BASE_URL` to your backend URL. The sample file also includes AWS
Cognito settings:

- `VITE_COGNITO_REGION`
- `VITE_COGNITO_POOL_ID`
- `VITE_COGNITO_WEB_CLIENT`

Optional for local development:

- `VITE_SKIP_AUTH` – set to `true` to bypass AWS Cognito during testing

## Playwright + FFMPEG Boot Package

Follow these steps to prepare the Codex environment with Playwright and a static
FFMPEG binary:

1. Run `pnpm run setup` to install Playwright dependencies and download the
   binary.
2. The `.env` file sets `FFMPEG_PATH=./bin/ffmpeg`. Export this variable in your
   shell if not using `pnpm run setup`.
3. Verify the installation with `pnpm run ffmpeg:version`.
4. Run unit tests with `pnpm test` (Vitest).
5. Run end-to-end tests with `pnpm run test:e2e` (Playwright).
