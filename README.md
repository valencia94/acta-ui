# ACTA-UI - Project Management Dashboard

[![Wallaby.js](https://img.shields.io/badge/wallaby.js-configured-green.svg)](https://wallabyjs.com)

A modern React-based project management dashboard for the ACTA system, built with TypeScript and deployed on AWS infrastructure.

## 🏗️ Architecture Overview

ACTA-UI is a Single Page Application (SPA) that provides a dashboard interface for project management, featuring:

- **Authentication**: AWS Cognito integration with idle logout
- **Project Dashboard**: View project details, timeline history, and document downloads
- **Document Management**: Download signed ACTA documents in PDF/DOCX formats
- **Approval Workflow**: Trigger approval emails via Lambda functions
- **Real-time Updates**: Project status tracking with visual indicators

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: [Node.js](https://nodejs.org/en/) >=20 <23
- **Package Manager**: [pnpm](https://pnpm.io/) ^9.15.9
- **Build Tool**: [Vite](https://vitejs.dev/) 5.4.19
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.5.4

### Frontend Stack

- **Framework**: [React](https://reactjs.org/) 18.3.1
- **Routing**: [React Router](https://reactrouter.com/) 6.30.1
- **UI Libraries**:
  - [Material UI](https://mui.com/) 6.4.12
  - [Chakra UI](https://chakra-ui.com/) 3.21.0
  - [Styled Components](https://styled-components.com/) 6.1.19
  - [Tailwind CSS](https://tailwindcss.com/) 3.4.17
- **Forms**: [React Hook Form](https://react-hook-form.com/) 7.58.1
- **Icons**: [Lucide React](https://lucide.dev/) 0.523.0
- **Animations**: [Framer Motion](https://www.framer.com/motion/) 12.19.1
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) 2.0.5

### AWS Integration

- **Authentication**: [AWS Amplify](https://aws.amazon.com/amplify/) 6.15.1
- **UI Components**: [@aws-amplify/ui-react](https://ui.docs.amplify.aws/) 6.11.2
- **Deployment**: S3 + CloudFront
- **API**: AWS Lambda + API Gateway

### Development Tools

- **Code Quality**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- **Testing**: [Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/)
- **Storybook**: Component development and documentation
- **Git Hooks**: [Husky](https://www.npmjs.com/package/husky) with pre-commit and commit-msg validation
- **Deployment**: Automated CI/CD via GitHub Actions

## 📁 Repository Structure

```
acta-ui/
├── 📁 docs/                          # Project documentation
│   ├── BRD.md                        # Build Release Documentation
│   ├── BUN.md                        # Bun usage guide
│   ├── cross-impact-map.md           # UI-API mapping documentation
│   └── SAM_DEPLOY.md                 # AWS SAM deployment guide
│
├── 📁 infra/                         # Infrastructure as Code
│   ├── template-core.yaml            # Core AWS CloudFormation template
│   └── template-wiring.yaml          # API routing CloudFormation template
│
├── 📁 public/                        # Static assets
│   ├── health                        # Health check endpoint
│   ├── index.html                    # Main HTML template
│   ├── robots.txt                    # Web crawlers instructions
│   └── assets/
│       └── ikusi-logo.png            # Application logo
│
├── 📁 scripts/                       # Deployment and utility scripts
│   ├── bootstrap_upscale.sh          # Environment setup
│   ├── check_css.sh                  # CSS validation
│   ├── check-env.cjs                 # Environment validation
│   ├── deploy-to-s3.sh               # S3 deployment
│   ├── prepare.cjs                   # Build preparation
│   ├── push-spa-routes.sh            # SPA routing setup
│   ├── run_playwright.cjs            # E2E test runner
│   ├── s3-oac-policy.json            # S3 Origin Access Control policy
│   └── smoke_ui.sh                   # Smoke testing
│
├── 📁 src/                           # Source code
│   ├── 📁 assets/                    # Application assets
│   │   ├── ikusi-logo.png
│   │   └── icons/                    # Favicon variants
│   │
│   ├── 📁 components/                # React components
│   │   ├── Header.tsx                # Main navigation header
│   │   ├── ProjectTable.tsx          # Project data table
│   │   ├── StatusChip.tsx            # Status indicator component
│   │   ├── Button.tsx                # Reusable button component
│   │   ├── Shell.tsx                 # Application shell/layout
│   │   ├── ActaButtons/              # Document action buttons
│   │   ├── App/                      # Main app component
│   │   ├── AppHooksWrapper/          # Hooks provider wrapper
│   │   ├── Button/                   # Enhanced button components
│   │   ├── Counter/                  # Counter component (demo)
│   │   └── LoadingMessage/           # Loading state component
│   │
│   ├── 📁 hooks/                     # Custom React hooks
│   │   ├── useAuth.ts                # Authentication logic
│   │   ├── useIdleLogout.ts          # Auto-logout on inactivity
│   │   └── useThemedFavicon.ts       # Dynamic favicon theming
│   │
│   ├── 📁 lib/                       # Utility libraries
│   │   └── api.ts                    # API client configuration
│   │
│   ├── 📁 pages/                     # Route components
│   │   ├── Dashboard.tsx             # Main dashboard page
│   │   └── Login.tsx                 # Authentication page
│   │
│   ├── 📁 styles/                    # Global styles
│   │   ├── amplify-overrides.css     # AWS Amplify UI customizations
│   │   ├── variables.css             # CSS custom properties
│   │   └── tailwind.css              # Tailwind CSS imports
│   │
│   ├── 📁 utils/                     # Utility functions
│   │   └── fetchWrapper.ts           # Enhanced fetch utility
│   │
│   ├── App.tsx                       # Root application component
│   ├── main.tsx                      # Application entry point
│   ├── env.schema.ts                 # Environment variables schema
│   ├── env.variables.ts              # Environment configuration
│   ├── aws-exports.js                # AWS Amplify configuration
│   ├── handler.py                    # Python Lambda handler
│   ├── sendProjectsForPM.ts          # Project management utility
│   ├── theme.ts                      # UI theme configuration
│   └── vite-env.d.ts                 # Vite type definitions
│
├── 📁 tests/                         # Test files
│   ├── e2e.spec.ts                   # End-to-end tests
│   ├── e2e.live.spec.ts              # Live environment E2E tests
│   ├── smoke.test.ts                 # Smoke tests
│   ├── playwright.preload.js         # Playwright setup
│   ├── playwright.setup.ts           # Test environment setup
│   ├── setup-playwright.ts           # Playwright configuration
│   └── setup-vitest.ts               # Vitest configuration
│
├── 📄 Configuration Files
├── package.json                      # Dependencies and scripts
├── pnpm-lock.yaml                    # Lock file for pnpm
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite build configuration
├── vitest.config.ts                  # Vitest test configuration
├── playwright.config.ts              # Playwright E2E configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── commitlint.config.cjs             # Commit message linting
├── wallaby.config.js                 # Wallaby.js test runner
├── env.schema.ts                     # Environment validation schema
├── .env.example                      # Environment variables template
└── README.md                         # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version >=20 <23
- **pnpm**: Version ^9 (automatically enforced)
- **Git**: For version control

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd acta-ui
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup Playwright (for E2E testing)**
   ```bash
   pnpm run setup
   ```

### Development Server

```bash
# Start development server (http://localhost:3000)
pnpm run dev

# Start Storybook (http://localhost:6006)
pnpm run dev:storybook

# Start local API server (requires AWS SAM)
pnpm run dev:api
```

## 📜 Available Scripts

### Development

- `pnpm run dev` - Start development server
- `pnpm run dev:storybook` - Start Storybook development server
- `pnpm run dev:api` - Start local API server with AWS SAM

### Building

- `pnpm run build` - Build for production
- `pnpm run build:analyze` - Build with bundle analyzer
- `pnpm run build:storybook` - Build Storybook static site
- `pnpm run preview` - Preview production build locally

### Testing

- `pnpm run test` - Run unit tests
- `pnpm run test:unit` - Run unit tests (alias)
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run test:e2e:live` - Run E2E tests against live environment
- `pnpm run test:vitest` - Run Vitest tests
- `pnpm run test:vitest:coverage` - Run tests with coverage report
- `pnpm run test:vitest:watch` - Run tests in watch mode

### Code Quality

- `pnpm run lint` - Run TypeScript check and ESLint
- `pnpm run format` - Format code with Prettier
- `pnpm run ci:check` - Run all checks (TypeScript + ESLint)
- `pnpm run ci:test` - Run all tests with coverage
- `pnpm run ci` - Run complete CI pipeline locally

### Dependencies

- `pnpm run update:patch` - Update patch versions
- `pnpm run update:minor` - Update minor versions
- `pnpm run update:major` - Update major versions (breaking changes)

### Deployment

- `pnpm run predeploy` - Pre-deployment build
- `pnpm run deploy` - Deploy to configured environment
- `pnpm run check:env` - Validate environment variables

## 🌍 Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-api-gateway-url.com

# AWS Cognito Authentication
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_WEB_CLIENT=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional Development Settings
VITE_SKIP_AUTH=false  # Set to 'true' to bypass authentication in development
```

### Environment Validation

The application uses Zod schemas for environment validation:

- `env.schema.ts` - Defines validation rules
- `env.variables.ts` - Exports validated environment variables
- `scripts/check-env.cjs` - Runtime environment validation

## 🔧 API Integration

The application integrates with a REST API backend via the following endpoints:

### Core Endpoints

- `GET /timeline/{id}` - Retrieve project timeline data
- `GET /download-acta/{id}?format=pdf|docx` - Download ACTA documents
- `GET /project-summary/{id}` - Get project summary information
- `POST /send-approval-email` - Trigger approval email workflow
- `POST /extract-project-place/{id}` - Extract project location data
- `GET /health` - Health check endpoint

### API Client Configuration

- **Location**: `src/lib/api.ts`
- **Wrapper**: `src/utils/fetchWrapper.ts` - Enhanced fetch with error handling
- **Authentication**: Automatic JWT token injection from AWS Cognito

For detailed API-UI component mapping, see [docs/cross-impact-map.md](docs/cross-impact-map.md).

## 🎨 UI Components & Styling

### Component Architecture

- **Atomic Design**: Components organized by complexity and reusability
- **Storybook Integration**: Interactive component documentation
- **TypeScript**: Full type safety across all components

### Styling Approach

- **Multi-library Strategy**: Combines Material UI, Chakra UI, and Tailwind CSS
- **Styled Components**: CSS-in-JS for dynamic styling
- **Theme System**: Centralized design tokens in `src/theme.ts`
- **Responsive Design**: Mobile-first approach with Tailwind utilities

### Key Components

- **ProjectTable**: Data table with sorting, filtering, and pagination
- **ActaButtons**: Document download and action buttons
- **StatusChip**: Visual status indicators with color coding
- **Header**: Navigation with authentication state
- **Shell**: Main layout wrapper with routing

## ☁️ AWS Infrastructure & Deployment

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   CloudFront    │    │   API Gateway    │    │   Lambda Functions  │
│   Distribution  │◄──►│   REST API       │◄──►│   Backend Logic     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   S3 Bucket     │    │   Route 53       │    │   AWS Cognito       │
│   Static Files  │    │   DNS            │    │   Authentication    │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

### Deployment Pipeline

The application uses GitHub Actions for CI/CD with the following workflow:

#### Required Repository Secrets

**Core Deployment**

- `AWS_ROLE_ARN` - IAM role for OIDC authentication
- `AWS_REGION` - Target AWS region (e.g., us-east-2)
- `S3_BUCKET_NAME` - S3 bucket for static assets
- `CLOUDFRONT_DIST_ID` - CloudFront distribution ID
- `VITE_API_BASE_URL` - API Gateway base URL

**Lambda Function ARNs**

- `GET_TIMELINE_ARN` - Timeline data retrieval
- `GET_DOWNLOAD_ACTA_ARN` - Document download
- `GET_PROJECT_SUMMARY_ARN` - Project summary
- `SEND_APPROVAL_EMAIL_ARN` - Email notifications
- `PROJECT_PLACE_DATA_EXTRACTOR_ARN` - Location data extraction
- `HEALTH_CHECK_ARN` - Health monitoring

#### Deployment Steps

1. **Automated Deployment** (via GitHub Actions)

   ```bash
   # Triggered on push to main/staging branches
   # See .github/workflows/build_deploy.yml
   ```

2. **Manual Deployment** (Local)

   ```bash
   # Build the application
   pnpm run build

   # Deploy to AWS
   AWS_REGION=us-east-2 \
   S3_BUCKET_NAME=acta-ui-frontend-prod \
   CLOUDFRONT_DIST_ID=EPQU7PVDLQXUA \
   bash scripts/deploy-to-s3.sh
   ```

3. **Infrastructure Deployment**

   ```bash
   # Deploy core infrastructure
   bash deploy-core.sh

   # Deploy API wiring
   bash deploy-wiring.sh
   ```

### CloudFront Configuration

If experiencing **Access Denied** errors, apply the S3 Origin Access Control policy:

```bash
# Apply OAC policy
aws s3api put-bucket-policy \
  --bucket acta-ui-frontend-prod \
  --policy file://scripts/s3-oac-policy.json \
  --region us-east-2

# Or use GitHub Action: apply_oac_policy.yml
```

### Environment-Specific Configuration

- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

Each environment requires its own set of environment variables and AWS resources.

## 🧪 Testing Strategy

### Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← Playwright
                    │   (Selenium)    │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │ ← Vitest + Testing Library
                  │  (Component Tests)    │
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │        Unit Tests               │ ← Vitest + Jest
              │     (Business Logic)            │
              └─────────────────────────────────┘
```

### Test Configuration

**Unit & Integration Tests**

- **Framework**: Vitest with jsdom
- **Location**: `tests/setup-vitest.ts`
- **Libraries**: Testing Library, Jest DOM
- **Coverage**: V8 coverage reports

**End-to-End Tests**

- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Location**: `tests/e2e.spec.ts`, `tests/e2e.live.spec.ts`
- **Setup**: `tests/playwright.setup.ts`

**Component Tests**

- **Storybook**: Interactive component testing
- **Visual Regression**: Automated screenshot comparison
- **Accessibility**: Automated a11y testing

### Test Data & Mocking

- **API Mocking**: Nock for HTTP request mocking
- **Environment**: Test-specific environment variables
- **Fixtures**: Reusable test data in `tests/` directory

### Quality Gates

Pre-commit hooks ensure code quality:

- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier code formatting
- **Type Checking**: TypeScript compiler validation
- **Commit Messages**: Conventional commit format

## 🔍 Performance & Monitoring

### Bundle Optimization

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: `pnpm run build:analyze`
- **Chunk Optimization**: Vite plugin for chunk splitting

### Performance Monitoring

- **Core Web Vitals**: Lighthouse integration
- **Bundle Size**: Automated size tracking
- **Load Time**: Performance budgets
- **Runtime Monitoring**: Error tracking integration

### Health Checks

- **Application Health**: `/health` endpoint
- **Smoke Tests**: `tests/smoke.test.ts`
- **Uptime Monitoring**: CloudWatch integration
- **Error Reporting**: Automated error notifications

## 📚 Documentation

### Available Documentation

- **[BRD.md](docs/BRD.md)** - Build Release Documentation
- **[cross-impact-map.md](docs/cross-impact-map.md)** - UI-API component mapping
- **[SAM_DEPLOY.md](docs/SAM_DEPLOY.md)** - AWS SAM deployment guide
- **[BUN.md](docs/BUN.md)** - Alternative runtime with Bun

### Component Documentation

- **Storybook**: Interactive component documentation
- **TypeScript**: Inline type documentation
- **JSDoc**: Function and class documentation

## 🤝 Development Workflow

### Git Workflow

1. **Feature Branch**: Create feature branch from `main`
2. **Development**: Implement changes with tests
3. **Pre-commit**: Automated linting and formatting
4. **Pull Request**: Code review and CI checks
5. **Merge**: Automated deployment to staging
6. **Release**: Manual promotion to production

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with customizations
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

### Development Tools

- **VS Code**: Recommended IDE with extension pack
- **Wallaby.js**: Real-time test runner
- **GitHub Copilot**: AI-powered code assistance
- **Husky**: Git hook management

## 🚨 Troubleshooting

### Common Issues

1. **Dependencies Installation**

   ```bash
   # Use pnpm instead of npm
   pnpm install

   # Clear cache if needed
   pnpm store prune
   ```

2. **Environment Variables**

   ```bash
   # Validate environment
   pnpm run check:env

   # Copy example file
   cp .env.example .env
   ```

3. **Build Errors**

   ```bash
   # Clear build cache
   rm -rf dist/
   rm -rf node_modules/.vite/

   # Rebuild
   pnpm run build
   ```

4. **Playwright Issues**

   ```bash
   # Reinstall browsers
   pnpm run setup

   # Check FFMPEG
   pnpm run ffmpeg:version
   ```

### Support Resources

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides in `/docs`
- **Storybook**: Component usage examples
- **Type Definitions**: IntelliSense support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.

---

**Built with ❤️ by the ACTA Team**
