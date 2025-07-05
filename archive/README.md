# ACTA-UI - Project Management Dashboard


A modern React-based project management dashboard for the ACTA system, built with TypeScript and deployed on AWS infrastructure.

## 🚀 **PRODUCTION STATUS - June 2025**



## 🏗️ Architecture Overview

ACTA-UI is a Single Page Application (SPA) that provides a dashboard interface for project management, featuring:

- **Authentication**: AWS Cognito integration with idle logout
- **Project Dashboard**: View project details, timeline history, and document downloads
- **Document Management**: Download signed ACTA documents in PDF/DOCX formats
- **Approval Workflow**: Trigger approval emails via Lambda functions
- **Real-time Updates**: Project status tracking with visual indicators

## 📊 UI Data Mapping & Architecture

### Component-API Integration Flow

```mermaid
graph TD
    A[User Login] --> B[AWS Cognito Auth]
    B --> C[Dashboard Component]
    C --> D[Project Manager/Admin Check]
    D --> E[PMProjectManager Component]
    D --> F[AdminDashboard Component]
    
    E --> G[getProjectsByPM API]
    F --> H[getAllProjects API]
    
    G --> I[ProjectSummary[] Response]
    H --> I
    I --> J[Transform to PMProject/Project]
    J --> K[ProjectTable Display]
    
    K --> L[Action Buttons]
    L --> M[generateSummariesForPM]
    L --> N[sendApproval]
    L --> O[downloadDocument]
```

### Data Type Transformations

| **Source** | **Target** | **Component** | **Purpose** |
|------------|------------|---------------|-------------|
| `ProjectSummary[]` | `PMProject[]` | PMProjectManager | PM project list with metadata |
| `ProjectSummary[]` | `Project[]` | Dashboard | Simple table display |
| `TimelineEvent[]` | `ActaDocument` | PDF Generation | Document content |
| `User` | `AuthState` | App-wide | Authentication status |

### API Endpoint Mapping

#### **Core Project Data**
```typescript
// Primary endpoints matching CloudFormation template
GET /project-summary/{id}           → ProjectSummary
GET /projects-by-pm/{email}         → ProjectSummary[]
GET /all-projects                   → ProjectSummary[]
GET /timeline/{id}                  → TimelineEvent[]

// Document operations
POST /generate-summaries-for-pm     → GenerationResult
POST /send-approval                 → ApprovalResult
GET /download-document/{id}         → S3DownloadURL
```

#### **Data Models**
```typescript
interface ProjectSummary {
  project_id: string;
  project_name: string;
  pm?: string;
  project_manager?: string;
  [key: string]: unknown;
}

interface PMProject {
  project_id: string;
  project_name: string;
  pm_email: string;
  project_status?: string;
  last_updated?: string;
  has_acta_document?: boolean;
}

interface Project {
  id: number;
  name: string;
  pm: string;
  status: string;
}
```

### Component Responsibility Matrix

| **Component** | **Data Source** | **User Role** | **Primary Function** |
|---------------|-----------------|---------------|---------------------|
| `Dashboard.tsx` | `getProjectsByPM()` | PM/Admin | Individual PM project view |
| `AdminDashboard.tsx` | `getAllProjects()` | Admin Only | System-wide project overview |
| `PMProjectManager.tsx` | `getProjectsByPM()`/`getAllProjects()` | PM/Admin | Project management interface |
| `ProjectTable.tsx` | Transformed data | PM/Admin | Tabular project display |
| `ActaButtons/*.tsx` | Context-based | PM/Admin | Document operations |
| `PDFPreview/*.tsx` | Generated content | PM/Admin | Document preview |

### Authentication & Authorization Flow

```typescript
// Auth flow integration
useAuth() → AWS Cognito → User Profile
  ↓
Role Detection (PM/Admin)
  ↓
Component Routing & Data Access
  ↓
API Calls with JWT Token
```

### Environment Configuration

| **Environment** | **API Base** | **Auth Mode** | **Mock Data** |
|-----------------|--------------|---------------|---------------|
| Development | `/api` (proxied) | Skip Auth | Enabled |
| Production | `https://api.acta.com` | Full Auth | Disabled |
| Testing | Mock Server | Mock Auth | Enabled |

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: >=20 <23
- **pnpm**: ^9.15.9 (install with `npm install -g pnpm`)
- **Git**: Latest version
- **AWS CLI**: For deployment (optional)

### Quick Start

```bash
# Clone repository
git clone https://github.com/valencia94/acta-ui.git
cd acta-ui

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open browser
open http://localhost:5173
```

### Development Commands

```bash
# Development
pnpm run dev              # Start dev server with hot reload
pnpm run dev:host         # Start dev server accessible on network

# Building
pnpm run build            # Production build
pnpm run preview          # Preview production build locally
pnpm run build:analyze    # Build with bundle analysis

# Code Quality
pnpm run lint             # Run ESLint + TypeScript check
pnpm run lint:fix         # Auto-fix ESLint issues
pnpm run format           # Format code with Prettier

# Testing
pnpm run test             # Run unit tests with Vitest
pnpm run test:e2e         # Run Playwright E2E tests
pnpm run test:coverage    # Run tests with coverage report
```

### Development Features

- 🔥 **Hot Module Replacement** - Instant updates during development
- 🎭 **Mock API Server** - Test UI without backend (set `VITE_USE_MOCK_API=true`)
- 🔒 **Skip Authentication** - Bypass login during development (set `VITE_SKIP_AUTH=true`)
- 🌐 **API Proxy** - CORS-free development with `/api` proxy to localhost
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS

---

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

## 📁 Repository Structure (Production Clean)

```
acta-ui/
├── 📁 archive/                       # 🗂️ Archived test/diagnostic files (325+ files)
│   ├── auth-diagnostic-report.json   # Authentication testing artifacts
│   ├── browser-testing-script.js     # Browser automation tests
│   ├── deployment-verification.cjs   # Deployment validation scripts
│   └── ... (all non-production files)
│
├── 📁 infra/                         # 🏗️ Infrastructure as Code
│   ├── acta-ui-secure-api-corrected.yaml    # ✅ WORKING CloudFormation template
│   ├── MASTER-PRODUCTION-TEMPLATE.yaml      # Master infrastructure template
│   └── template-*.yaml                      # Additional CF templates
│
├── 📁 public/                        # 🌐 Static assets
│   ├── index.html                    # ✅ Main HTML template (correct title)
│   ├── robots.txt                    # Web crawlers instructions
│   ├── button-functionality-test.js  # UI validation scripts
│   ├── navigation-button-test.js     # Navigation testing
│   └── assets/
│       └── ikusi-logo.png            # Application logo
│
├── 📁 scripts/                       # 🚀 Deployment utilities
│   ├── deploy-with-cache-invalidation.sh    # ✅ Production deployment script
│   ├── check-env.cjs                         # Environment validation
│   └── ... (deployment support scripts)
│
├── 📁 src/                           # 💻 Source code (PRODUCTION READY)
│   ├── 📁 components/                # React components
│   │   ├── Header.tsx                # ✅ Navigation header
│   │   ├── ProjectTable.tsx          # ✅ Project data table (no mock data)
│   │   ├── PMProjectManager.tsx      # ✅ PM interface (real API calls)
│   │   ├── ActaButtons/              # ✅ Document action buttons
│   │   │   ├── ActaButtons.tsx       
│   │   │   ├── DownloadButton.tsx    
│   │   │   ├── GenerateButton.tsx    
│   │   │   ├── PreviewButton.tsx     
│   │   │   ├── SendApprovalButton.tsx
│   │   │   └── WordButton.tsx        
│   │   ├── PDFPreview/               # ✅ PDF viewer components
│   │   │   ├── index.ts              
│   │   │   ├── PDFPreview.tsx        
│   │   │   └── PDFViewerCore.tsx     
│   │   └── StatusChip.tsx            # Status indicator component
│   │
│   ├── 📁 hooks/                     # Custom React hooks
│   │   ├── useAuth.ts                # ✅ Authentication logic (Cognito)
│   │   ├── useIdleLogout.ts          # Auto-logout on inactivity
│   │   └── useThemedFavicon.ts       # Dynamic favicon theming
│   │
│   ├── 📁 lib/                       # Utility libraries
│   │   └── api.ts                    # ✅ API client (real endpoints, no mocks)
│   │
│   ├── 📁 pages/                     # Route components
│   │   ├── Dashboard.tsx             # ✅ Main dashboard (no test projects)
│   │   ├── AdminDashboard.tsx        # ✅ Admin interface
│   │   └── Login.tsx                 # ✅ Authentication page
│   │
│   ├── 📁 utils/                     # Utility functions
│   │   ├── fetchWrapper.ts           # ✅ Enhanced fetch utility
│   │   ├── mockApiServer.ts          # 🧪 Development mock API
│   │   └── backendDiagnostic.ts      # Backend connectivity check
│   │
│   ├── App.tsx                       # ✅ Root app (correct title, clean routing)
│   ├── main.tsx                      # Application entry point
│   ├── env.variables.ts              # ✅ Environment configuration
│   └── aws-exports.js                # ✅ AWS Amplify config (production)
│
├── 📄 Configuration Files (PRODUCTION READY)
├── package.json                      # ✅ Dependencies (clean, no test artifacts)
├── pnpm-lock.yaml                    # Lock file for pnpm
├── amplify.yml                       # ✅ Deployment config (cache invalidation)
├── tsconfig.json                     # ✅ TypeScript config (error-free)
├── vite.config.ts                    # ✅ Vite build config (proxy, optimization)
├── vitest.config.ts                  # Test configuration
├── tailwind.config.js                # ✅ Tailwind CSS config
├── .env.production                   # ✅ Production environment variables
├── .env.development                  # Development environment variables
└── .eslintignore                     # ✅ Excludes /archive from linting

📋 DOCUMENTATION
├── README.md                         # ✅ Updated with latest architecture
├── DEPLOYMENT_CHECKLIST.md          # Production deployment guide
├── CACHE_INVALIDATION_DEPLOYMENT_FIX.md  # Cache issues resolution
├── CACHE_INVALIDATION_SUCCESS_REPORT.md  # Fixes implemented
├── INFRASTRUCTURE_RECONSTRUCTION_PLAN.md # Infrastructure guide
└── PRODUCTION_DEPLOYMENT_SUCCESS.md      # Final deployment status
```

### 🎯 Key Changes from Cleanup (July 2025)

- ✅ **325+ files moved to `/archive`** - No test artifacts in production
- ✅ **All mock data removed** - PMProjectManager uses real API calls
- ✅ **TypeScript errors fixed** - Proper type transformations throughout  
- ✅ **Cache invalidation implemented** - amplify.yml with proper headers
- ✅ **Document title corrected** - "Ikusi · Acta Platform" in App.tsx
- ✅ **Production environment** - .env.production with correct Cognito config
- ✅ **Real API integration** - No hardcoded projects, uses getAllProjects/getProjectsByPM
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

## 🚀 Production Deployment Guide

### Quick Deploy Steps

1. **Verify Clean Build**
   ```bash
   pnpm run lint    # Must pass with no errors
   pnpm run build   # Must complete successfully
   ```

2. **Deploy to AWS Amplify**
   ```bash
   git push origin develop    # Triggers automatic deployment
   ```

3. **Manual Cache Invalidation** (if needed)
   ```bash
   # Using AWS CLI
   aws amplify start-job --app-id YOUR_APP_ID --branch-name develop --job-type RELEASE
   
   # Or use the deployment script
   ./scripts/deploy-with-cache-invalidation.sh
   ```

### Environment Variables for Production

```bash
# .env.production (automatically used by Amplify)
VITE_API_BASE_URL=https://your-api-gateway.execute-api.us-east-2.amazonaws.com/prod
VITE_COGNITO_REGION=us-east-2
VITE_COGNITO_POOL_ID=us-east-2_YourPoolId
VITE_COGNITO_WEB_CLIENT=your-client-id
VITE_SKIP_AUTH=false
VITE_USE_MOCK_API=false
```

### Post-Deployment Verification

After deployment, verify these key items:

✅ **Document Title**: Should show "Ikusi · Acta Platform"  
✅ **No Test Projects**: Dashboard should be empty or show real data only  
✅ **Authentication**: Cognito login should work  
✅ **API Connectivity**: Backend diagnostic should pass  
✅ **Button Functionality**: All ACTA buttons should be responsive  

### Troubleshooting Cache Issues

If changes aren't appearing:

1. **Hard Refresh**: `Ctrl+F5` or `Cmd+Shift+R`
2. **Clear Browser Cache**: Dev Tools → Application → Storage → Clear
3. **Invalidate CloudFront**: AWS Console → CloudFront → Invalidations → `/*`
4. **Emergency Deploy**: Change a comment in `App.tsx` and redeploy

---

## 🌍 Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-api-gateway-url.com

# AWS Cognito Authentication
VITE_COGNITO_REGION=us-east-2
VITE_COGNITO_POOL_ID=us-east-2_xxxxxxxxx
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
