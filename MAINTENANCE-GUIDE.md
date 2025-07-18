# ACTA-UI Maintenance Guide

**Last Updated:** July 9, 2025

## Overview

This document serves as a guide for maintaining the ACTA-UI application. It covers key aspects of the codebase, deployment process, and best practices for ongoing development and maintenance.

## Key Files and Their Purposes

### Authentication Configuration Files

| File                    | Purpose                             | Format                                   | Notes                                    |
| ----------------------- | ----------------------------------- | ---------------------------------------- | ---------------------------------------- |
| `src/aws-exports.js`    | ES module version for imports       | ES Module (`export default`)             | Used by imports in the application       |
| `public/aws-exports.js` | Browser-compatible version          | Global assignment (`window.awsmobile =`) | Loaded directly via script tag           |
| `dist/aws-exports.js`   | Deployed browser-compatible version | Global assignment (`window.awsmobile =`) | Must be copied from public/ during build |

### Core Application Files

| File                        | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `index.html`                | HTML entry point with script loading order         |
| `src/main.tsx`              | Application entry point with Amplify configuration |
| `src/App.tsx`               | Main React component with routing                  |
| `src/lib/api.ts`            | API functions for backend integration              |
| `src/utils/fetchWrapper.ts` | Authentication-aware fetch wrapper                 |
| `src/hooks/useAuth.ts`      | Authentication hook for React components           |

### Configuration Files

| File                 | Purpose                               |
| -------------------- | ------------------------------------- |
| `vite.config.ts`     | Build configuration including plugins |
| `.env`               | Environment variables for development |
| `.env.production`    | Environment variables for production  |
| `tsconfig.json`      | TypeScript compiler configuration     |
| `tailwind.config.js` | Tailwind CSS configuration            |

### Deployment Scripts

| File                         | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `fix-auth-config.sh`         | Ensures proper authentication configuration |
| `fix-aws-exports-browser.sh` | Creates browser-compatible aws-exports.js   |
| `deploy-production.sh`       | Builds and deploys to S3/CloudFront         |
| `test-auth-flow.sh`          | Validates authentication configuration      |
| `test-production.js`         | Comprehensive production validation         |

## Authentication Maintenance

### Adding or Modifying Users

Users are managed through the AWS Cognito User Pool:

1. Log in to the AWS Console
2. Navigate to Cognito > User Pools > us-east-2_FyHLtOhiY
3. Use the "Create user" or "Manage users" functionality

### Updating Authentication Configuration

If you need to update the Cognito User Pool or Identity Pool configuration:

1. Update both versions of aws-exports.js:
   - ES module version in `src/aws-exports.js`
   - Browser-compatible version in `public/aws-exports.js`
2. Ensure both files contain the complete configuration with both User Pool and Identity Pool settings
3. Run `./fix-auth-config.sh` to validate and apply the changes
4. Deploy with `./deploy-production.sh`

## Deployment Process

### Standard Deployment

```bash
# 1. Ensure proper authentication configuration
./fix-auth-config.sh

# 2. Deploy to production
./deploy-production.sh

# 3. Verify deployment
./test-auth-flow.sh
```

### Handling Auth Configuration Changes

If you need to update the authentication configuration:

1. Make changes to both `src/aws-exports.js` and `public/aws-exports.js`
2. Run `./fix-auth-config.sh` to validate and apply changes
3. Deploy using `./deploy-production.sh`
4. Verify with `./test-auth-flow.sh`

### Deployment Validation Checklist

- ✅ Browser-compatible aws-exports.js exists in public/
- ✅ aws-exports.js loads in the head section of index.html
- ✅ dist/aws-exports.js exists and is browser-compatible
- ✅ User Pool ID (us-east-2_FyHLtOhiY) is in the build
- ✅ Identity Pool ID (us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35) is in the build

## Common Issues and Solutions

### "Auth UserPool not configured" Error

**Possible Causes:**

- aws-exports.js not loaded before Amplify configuration
- aws-exports.js using ES module syntax in browser context
- Missing or incorrect User Pool configuration

**Solutions:**

- Verify aws-exports.js is loaded in the head section of index.html
- Ensure public/aws-exports.js uses window.awsmobile assignment
- Run `./fix-auth-config.sh` to reset authentication configuration

### "Unexpected token 'export'" Error

**Possible Causes:**

- ES module syntax in a file loaded via direct script tag

**Solutions:**

- Use browser-compatible version with `window.awsmobile =` instead of `export default`
- Run `./fix-aws-exports-browser.sh` to create the correct version

### 401 Unauthorized API Errors

**Possible Causes:**

- Missing or incorrect Identity Pool configuration
- Issues with token acquisition or renewal
- CORS configuration issues

**Solutions:**

- Verify complete Auth configuration in aws-exports.js
- Check browser console for authentication errors
- Inspect network requests for proper Authorization headers

### Missing or Incorrect aws-exports.js in Build

**Possible Causes:**

- Build plugin not correctly copying the file
- Wrong version of aws-exports.js being copied

**Solutions:**

- Verify vite.config.ts includes the copy-aws-exports plugin
- Ensure plugin copies from public/ (browser-compatible version)
- Manually verify dist/aws-exports.js after build

## Adding New Features

When adding new features, consider these aspects:

### Authentication Integration

- Use the `useAuth` hook for authentication state and operations
- Access tokens via `getAuthToken()` for API requests
- Use `fetchWrapper` for authenticated API calls

### API Integration

- Add new API functions to `src/lib/api.ts`
- Use the `fetchWrapper` to handle authentication
- Add appropriate error handling for auth failures

### UI Components

- Follow the existing component structure in `src/components/`
- Leverage Chakra UI and Tailwind CSS for consistent styling
- Use React hooks for state and side effects

## Performance Considerations

- Use code splitting for large features (`React.lazy` and `import()`)
- Optimize images and assets before adding to the project
- Minimize third-party dependencies where possible

## Security Best Practices

- Never store sensitive information in localStorage
- Always use HTTPS for API communication
- Use signed URLs with short expiration for document access
- Validate all user inputs on both client and server
- Keep AWS Amplify and other dependencies updated

## Documentation Resources

- [AWS Amplify Authentication Documentation](https://docs.amplify.aws/lib/auth/getting-started/)
- [Cognito User Pools Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito Identity Pools Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [Vite Documentation](https://vitejs.dev/guide/)

## Project-Specific Documentation

- `ACTA-UI-DOCUMENTATION.md`: Comprehensive project documentation
- `AUTHENTICATION-FIX.md`: Details of the authentication fix implementation
- `README.md`: Basic project overview and setup instructions

## Contact Information

For questions or issues related to the ACTA-UI project, contact:

- **Development Team**: development@ikusi.com
- **Project Manager**: christian.valencia@ikusi.com

---

This maintenance guide should be updated whenever significant changes are made to the project structure or authentication flow.
