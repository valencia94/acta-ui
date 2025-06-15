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
- GitHub Pages Deployment

## Environment variables

Create a `.env` file based on `.env.example` and provide the API URL used by
the UI:

```bash
VITE_API_BASE_URL=https://your-api.example.com
```

This variable must be set for the application to fetch data from the backend.
