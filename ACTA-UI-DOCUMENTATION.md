# ACTA-UI Documentation: Single Source of Truth

**Last Updated:** July 9, 2025

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Authentication Flow](#authentication-flow)
5. [Key Components](#key-components)
6. [API Integration](#api-integration)
7. [AWS Resource Configuration](#aws-resource-configuration)
8. [Build and Deployment Process](#build-and-deployment-process)
9. [Common Issues and Solutions](#common-issues-and-solutions)
10. [Testing and Validation](#testing-and-validation)
11. [Performance Considerations](#performance-considerations)
12. [Security Considerations](#security-considerations)

## Introduction

ACTA-UI is a React-based web application built with Vite that serves as the frontend for the ACTA platform. The application allows project managers to generate, view, download, and send approval requests for project documentation (Actas). The system integrates with AWS Cognito for authentication and uses DynamoDB for data storage.

### Key Features

- User authentication via AWS Cognito
- Dashboard for project management
- Document generation for projects
- PDF and DOCX document previewing and downloading
- Email functionality for approval workflows
- Role-based access control (admin vs. standard users)

## Architecture Overview

ACTA-UI follows a modern React single-page application architecture with the following key technologies:

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom components
- **Authentication**: AWS Amplify + Cognito (User Pool + Identity Pool)
- **API Integration**: Custom wrapper around fetch for AWS API Gateway
- **Data Storage**: AWS DynamoDB (accessed through authenticated API Gateway)
- **Deployment**: AWS S3 + CloudFront

### Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    AWS          │     │   AWS           │     │   AWS           │
│    CloudFront   │────▶│   S3 Bucket     │     │   Cognito       │
│                 │     │   (Static Site) │     │                 │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │                                               │
         │                                               │
┌────────▼────────┐                            ┌─────────▼────────┐
│                 │                            │                  │
│    Browser      │                            │   Identity Pool  │
│    Client       │                            │                  │
│                 │                            └─────────┬────────┘
└────────┬────────┘                                      │
         │                                               │
         │                                               │
┌────────▼────────┐     ┌─────────────────┐     ┌────────▼────────┐
│                 │     │                 │     │                 │
│   AWS           │     │   AWS           │     │   AWS           │
│   API Gateway   │────▶│   Lambda        │────▶│   DynamoDB      │
│                 │     │   Functions     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Project Structure

### Root Directory Structure

```
acta-ui/
├── dist/               # Built application files
├── infra/              # AWS infrastructure templates (CloudFormation)
├── lambda-functions/   # Backend Lambda function code
├── node_modules/       # Dependencies
├── public/             # Static files including aws-exports.js
├── scripts/            # Deployment and utility scripts
├── src/                # Source code
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API and utilities
│   ├── pages/          # Page components
│   ├── styles/         # CSS and style definitions
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   ├── aws-exports.js  # AWS Amplify configuration
│   ├── main.tsx        # Application entry point
│   └── ...
├── tests/              # Test files
├── .env                # Environment variables
├── aws-exports.js      # Root-level AWS Amplify configuration
├── index.html          # HTML entry point
├── package.json        # Project metadata and dependencies
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── ...
```

### Key File Descriptions

| File                                    | Description                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `src/aws-exports.js`                    | Contains AWS configuration for Cognito User Pool, Identity Pool, and API Gateway |
| `public/aws-exports.js`                 | Browser-compatible version of AWS configuration that sets `window.awsmobile`     |
| `src/main.tsx`                          | Application entry point that configures AWS Amplify and renders the React app    |
| `src/App.tsx`                           | Main React component with routing logic                                          |
| `src/hooks/useAuth.ts`                  | Custom hook for authentication state and operations                              |
| `src/lib/api.ts`                        | API functions for interacting with backend services                              |
| `src/utils/fetchWrapper.ts`             | Wrapper for fetch API with authentication handling                               |
| `src/components/DynamoProjectsView.tsx` | Component for displaying projects from DynamoDB                                  |
| `src/pages/Dashboard.tsx`               | Main dashboard page with project management functionality                        |

## Authentication Flow

ACTA-UI uses AWS Cognito for authentication with a dual-flow approach:

1. **User Pool Authentication**: Used for user sign-in/sign-out and session management
2. **Identity Pool Authentication**: Used for accessing AWS resources (particularly DynamoDB)

### Authentication Configuration

The configuration for both User Pool and Identity Pool is in `aws-exports.js`:

```javascript
// Key authentication configuration
const awsmobile = {
  // User Pool Configuration (for authentication)
  aws_user_pools_id: "us-east-2_FyHLtOhiY",
  aws_user_pools_web_client_id: "dshos5iou44tuach7ta3ici5m",

  // Identity Pool Configuration (for AWS service access)
  aws_cognito_identity_pool_id:
    "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
  aws_cognito_region: "us-east-2",

  // Auth section combining both flows
  Auth: {
    // User Pool configuration
    userPoolId: "us-east-2_FyHLtOhiY",
    userPoolWebClientId: "dshos5iou44tuach7ta3ici5m",

    // Identity Pool configuration
    identityPoolId: "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
    identityPoolRegion: "us-east-2",

    // Authentication settings
    authenticationFlowType: "USER_SRP_AUTH",
    mandatorySignIn: true,
    region: "us-east-2",
  },
};
```

### Authentication Initialization

The authentication is initialized in `src/main.tsx` through AWS Amplify:

1. Wait for `window.awsmobile` to be available (loaded via script tag in index.html)
2. Configure Amplify with the AWS configuration
3. Fall back to importing aws-exports.js if the window.awsmobile isn't available

### Critical Authentication Files

- `index.html`: Loads aws-exports.js via script tag before main bundle
- `public/aws-exports.js`: Browser-compatible version that sets window.awsmobile
- `src/aws-exports.js`: ES module version for imports within the application
- `src/main.tsx`: Configures Amplify with authentication settings
- `src/hooks/useAuth.ts`: Manages authentication state and operations

## Key Components

### Dashboard (`src/pages/Dashboard.tsx`)

The Dashboard is the main interface after login, featuring:

- Project statistics
- Project listing from DynamoDB
- ACTA document generation functionality
- Document download options (PDF, DOCX)
- Document preview functionality
- Email approval workflow

### DynamoProjectsView (`src/components/DynamoProjectsView.tsx`)

This component:

- Directly queries DynamoDB using credentials from the Cognito Identity Pool
- Displays projects associated with the logged-in user
- Provides filtering and sorting functionality
- Allows project selection for ACTA generation

### PDFPreview (`src/components/PDFPreview.tsx`)

- Displays PDF documents in a modal overlay
- Uses secured S3 URLs for document access
- Handles loading states and errors

### ActaButtons (`src/components/ActaButtons/ActaButtons.tsx`)

- UI component containing action buttons for ACTA operations
- Manages loading states during operations
- Provides consistent UI across the application

### EmailInputDialog (`src/components/EmailInputDialog.tsx`)

- Modal dialog for collecting email addresses for approval workflow
- Validates email inputs
- Integrates with API for sending approval emails

## API Integration

### API Structure

The API integration is centered around the following files:

- `src/lib/api.ts`: Contains all API function definitions
- `src/utils/fetchWrapper.ts`: Handles authentication headers and request formatting
- `src/utils/backendDiagnostic.ts`: Provides diagnostic functions for API connectivity

### Key API Functions

| Function               | Description                              |
| ---------------------- | ---------------------------------------- |
| `getProjectsByPM`      | Fetches projects associated with a PM    |
| `generateActaDocument` | Generates an ACTA document for a project |
| `getS3DownloadUrl`     | Gets a signed URL for document download  |
| `checkDocumentInS3`    | Verifies if a document exists in S3      |
| `sendApprovalEmail`    | Sends an approval email for a document   |

### Authentication in API Calls

API calls use the following pattern for authentication:

1. Get a JWT token from Cognito via the `getAuthToken` function
2. Include the token in the Authorization header
3. Handle 401/403 responses with appropriate error messages and re-authentication flows

## AWS Resource Configuration

### CloudFront Distribution

- **ID**: EPQU7PVDLQXUA
- **Domain**: d7t9x3j66yd8k.cloudfront.net
- **Origin**: S3 bucket (acta-ui-frontend-prod)
- **Behaviors**: Default (_) points to S3, /api/_ paths point to API Gateway

### S3 Bucket

- **Name**: acta-ui-frontend-prod
- **Region**: us-east-2
- **Purpose**: Hosts the static files for the application

### Cognito User Pool

- **ID**: us-east-2_FyHLtOhiY
- **Web Client ID**: dshos5iou44tuach7ta3ici5m
- **Domain**: us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com

### Cognito Identity Pool

- **ID**: us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35
- **Region**: us-east-2
- **Authenticated Role**: arn:aws:iam::703671891952:role/ActaUI-DynamoDB-AuthenticatedRole

### API Gateway

- **Endpoint**: https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod
- **Region**: us-east-2
- **Stage**: prod

## Build and Deployment Process

### Build Process

The build process uses Vite with the following key aspects:

1. Vite compiles TypeScript and bundles JavaScript files
2. CSS is processed with Tailwind CSS and PostCSS
3. A custom plugin copies aws-exports.js to the dist folder
4. Assets are fingerprinted for cache busting

### Deployment Process

The deployment flow is managed by `deploy-production.sh`:

1. Ensure browser-compatible aws-exports.js exists in public/
2. Build the application with Vite
3. Verify aws-exports.js is correctly included in the build
4. Upload files to S3 bucket
5. Invalidate CloudFront cache

### Required Environment Variables

Environment variables are loaded from `.env` and `.env.production` files:

- `VITE_API_BASE_URL`: API Gateway endpoint URL
- `VITE_AWS_REGION`: AWS region (us-east-2)
- `VITE_S3_BUCKET`: S3 bucket for documents

## Common Issues and Solutions

### Authentication Issues

**Issue**: "Auth UserPool not configured" error
**Solution**:

- Ensure aws-exports.js is loaded before main bundle
- Make sure aws-exports.js uses window.awsmobile assignment, not ES module exports
- Verify both User Pool and Identity Pool configuration is present

**Issue**: "Unexpected token 'export'" error when loading aws-exports.js
**Solution**:

- Use browser-compatible version of aws-exports.js that assigns to window.awsmobile
- Don't use ES module syntax in scripts loaded directly via script tags

### API Connection Issues

**Issue**: 401 Unauthorized when accessing API
**Solution**:

- Verify JWT token is correctly included in requests
- Check Cognito User Pool configuration
- Ensure API Gateway has proper CORS configuration

**Issue**: CORS errors when accessing API
**Solution**:

- Add appropriate CORS headers to API Gateway responses
- Set `credentials: 'include'` in fetch requests
- Verify API Gateway CORS configuration includes the application domain

### Document Access Issues

**Issue**: Unable to download or preview documents
**Solution**:

- Verify Identity Pool permissions for S3 access
- Check S3 bucket CORS settings
- Ensure proper error handling in download functions

## Testing and Validation

### Manual Testing Process

1. Log in with test credentials (e.g., christian.valencia@ikusi.com)
2. Verify projects load in the dashboard
3. Test ACTA document generation
4. Test document download in both PDF and DOCX formats
5. Test document preview functionality
6. Test email approval workflow

### Automated Tests

- Unit tests in the `tests/` directory
- API endpoint tests in `test-api-connectivity.js`
- Authentication flow tests in `test-auth-flow.js`
- Production validation in `test-production.js`

### Test User Credentials

- **Email**: christian.valencia@ikusi.com
- **Password**: PdYb7TU7HvBhYP7$!
- **Role**: Admin (can access all projects)

## Performance Considerations

- Large dependencies are split into separate chunks to optimize loading times
- PDF.js is lazily loaded only when needed for PDF preview
- Critical authentication code is prioritized for early loading
- CloudFront caching is used for static assets

## Security Considerations

- JWT tokens are securely handled and not stored in localStorage
- API requests use HTTPS
- AWS resources are protected with IAM roles and policies
- S3 documents are accessed via signed URLs with short expiration times
- Email validation is implemented for approval workflow

---

## Additional Information

### Required Dependencies

Key dependencies in package.json:

- `aws-amplify`: Core authentication and AWS service integration
- `react`: UI library
- `framer-motion`: Animations
- `tailwindcss`: Utility-first CSS framework
- `lucide-react`: Icon library
- `react-hot-toast`: Toast notifications

### Development Setup

1. Clone the repository
2. Install dependencies with `npm install` or `pnpm install`
3. Set up local environment variables in `.env`
4. Run the development server with `npm run dev`

### Useful Scripts

- `fix-auth-config.sh`: Ensures proper authentication configuration
- `rebuild-and-deploy-complete.sh`: Full rebuild and deployment
- `test-auth-flow.sh`: Tests authentication configuration
- `test-production.js`: Validates production deployment

---

_This documentation serves as the single source of truth for the ACTA-UI project. Keep it updated as changes are made to the project._
