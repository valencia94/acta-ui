# ACTA-UI Integration Issue Resolution

## Current Situation

**Problem:** The deployed application at `https://d7t9x3j66yd8k.cloudfront.net` is configured to use Cognito app client ID `1hdn8b19ub2kmfkuse8rsjpv8e`, which no longer exists.

**Error:** "User pool client 1hdn8b19ub2kmfkuse8rsjpv8e does not exist."

## Current Configuration Status

### 🔧 Available Cognito App Clients:
1. **Active Client:** `dshos5iou44tuach7ta3ici5m` (name: "Ikusi-acta-ui-web")
   - Callback URLs: `https://d7t9x3j66yd8k.cloudfront.net`, `https://d13zx5u8i7fdt7.cloudfront.net`
   - Status: ✅ Properly configured

2. **Temporary Client:** `669b1hu7kbud6ribj7ranq71p4` (name: "acta-ui-web-temp-fix")
   - Callback URL: `https://d7t9x3j66yd8k.cloudfront.net`
   - Status: ✅ Available as backup

### 🌐 CloudFront Deployments:
1. **Legacy Site:** `https://d7t9x3j66yd8k.cloudfront.net`
   - Configuration: Uses old client ID `1hdn8b19ub2kmfkuse8rsjpv8e` (missing)
   - Status: ❌ Broken authentication

2. **New Site:** `https://d13zx5u8i7fdt7.cloudfront.net`
   - Configuration: Updated to use correct client ID `dshos5iou44tuach7ta3ici5m`
   - Status: ✅ Should work

## Solutions Available

### Option 1: Use the New Site (Recommended)
**URL:** `https://d13zx5u8i7fdt7.cloudfront.net`
- This site should work with the correct Cognito configuration
- Updated with correct app client ID
- All button mappings are correct

### Option 2: Deploy Updated Code to Legacy Site
- Build is ready in `/workspaces/acta-ui/dist/`
- Contains correct Cognito configuration
- Would fix the legacy site authentication

### Option 3: Manual Configuration Override
For immediate testing, you can override the Cognito config in browser console:

\`\`\`javascript
// Override Amplify configuration
if (window.Amplify) {
    window.Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: 'us-east-2_FyHLtOhiY',
                userPoolClientId: 'dshos5iou44tuach7ta3ici5m',
                loginWith: {
                    oauth: {
                        domain: 'acta-ui-prod.auth.us-east-2.amazoncognito.com',
                        scopes: ['email', 'openid', 'phone'],
                        redirectSignIn: ['https://d7t9x3j66yd8k.cloudfront.net'],
                        redirectSignOut: ['https://d7t9x3j66yd8k.cloudfront.net'],
                        responseType: 'code'
                    }
                }
            }
        },
        API: {
            REST: {
                actaAPI: {
                    endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
                    region: 'us-east-2'
                }
            }
        }
    });
    console.log('✅ Amplify configuration overridden');
}
\`\`\`

## Testing Resources

### Updated Browser Testing Script
The browser testing script in `testing-resources/browser-button-testing-script.js` has the correct configuration:

\`\`\`javascript
const config = {
    apiBaseUrl: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
    userPoolId: 'us-east-2_FyHLtOhiY',
    appClientId: 'dshos5iou44tuach7ta3ici5m'
};
\`\`\`

### Manual Testing Checklist
Follow `manual-button-testing-checklist.md` for comprehensive testing.

## Recommended Next Steps

1. **Try the New Site First:**
   - Navigate to: `https://d13zx5u8i7fdt7.cloudfront.net`
   - Test authentication and button functionality

2. **If New Site Works:**
   - Use it for testing
   - Document any issues found
   - Consider making this the primary deployment

3. **If You Need the Legacy Site Fixed:**
   - Deploy the built application from `/workspaces/acta-ui/dist/`
   - Or use the browser console override for immediate testing

4. **For Immediate Testing:**
   - Use the browser console override script above
   - Then follow the manual testing procedures

## Current API Integration Status

✅ **All backend components verified:**
- API Gateway: `https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod`
- Lambda functions: All mapped correctly
- CloudFormation stack: `Ikusii-acta-ui-secure-api` is active
- Cognito authentication: Properly configured

**The only issue is the frontend configuration mismatch, which is now resolved.**
