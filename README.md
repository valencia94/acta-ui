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

## Environment variables

Create a `.env` file based on `.env.example` and set `VITE_API_BASE_URL` to the
backend URL used by the UI. The value must be a valid URL or the app will exit
on start:

```bash
VITE_API_BASE_URL=http://localhost:9999
```

Adjust this value if your API is hosted elsewhere.
The environment is validated during `vite dev` and `vite build` via
[`vite-plugin-validate-env`](https://github.com/Julien-R44/vite-plugin-validate-env).

When running the automated tests or building the project, provide the variable on the command line:

```bash
VITE_API_BASE_URL=http://localhost:9999 pnpm test
VITE_API_BASE_URL=http://localhost:9999 pnpm run build
```
