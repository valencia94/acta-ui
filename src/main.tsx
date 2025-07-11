// src/main.tsx
// Import critical functions to ensure they're included in the build
import { getSummary, getTimeline, getDownloadUrl, sendApprovalEmail, getProjectsByPM, getAllProjects } from "@/lib/api";
import { fetcher, getAuthToken } from "@/utils/fetchWrapper";

// 🔐 Amplify core import & configuration
import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import hooks
import '@/hooks/useAuth';
import '@/hooks/useIdleLogout';
import '@/hooks/useThemedFavicon';

// AWS configuration is loaded via script tag in index.html
declare global {
  interface Window {
    getSummary: typeof getSummary;
    getTimeline: typeof getTimeline;
    getDownloadUrl: typeof getDownloadUrl;
    sendApprovalEmail: typeof sendApprovalEmail;
    getProjectsByPM: typeof getProjectsByPM;
    getAllProjects: typeof getAllProjects;
    fetchWrapper: typeof fetcher;
    getAuthToken: typeof getAuthToken;
  }
}

// Declare awsmobile separately to avoid conflicts
declare const awsmobile: any;

// Enhanced Amplify configuration with proper waiting
const configureAmplify = async () => {
  console.log('🔧 Attempting to configure Amplify...');
  
  // Wait for aws-exports.js to load
  let attempts = 0;
  while (!window.awsmobile && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.awsmobile) {
    console.log('✅ AWS config found, configuring Amplify:', window.awsmobile);
    
    // AWS Amplify v6 requires specific configuration structure
    const amplifyConfig = {
      Auth: {
        Cognito: {
          userPoolId: window.awsmobile.aws_user_pools_id || 'us-east-2_FyHLtOhiY',
          userPoolClientId: window.awsmobile.aws_user_pools_web_client_id || 'dshos5iou44tuach7ta3ici5m',
          identityPoolId: window.awsmobile.aws_cognito_identity_pool_id || 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
          loginWith: {
            username: true,
            email: true
          },
          signUpVerificationMethod: 'code' as const,
          userAttributes: {
            email: {
              required: true
            }
          },
          allowGuestAccess: true
        }
      },
      API: {
        REST: {
          ActaAPI: {
            endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
            region: 'us-east-2'
          }
        }
      },
      Storage: {
        S3: {
          bucket: 'projectplace-dv-2025-x9a7b',
          region: 'us-east-2'
        }
      }
    };
    
    try {
      Amplify.configure(amplifyConfig);
      console.log('✅ Amplify configured successfully with v6 structure');
    } catch (err) {
      console.error('❌ Failed to configure Amplify:', err);
    }
  } else {
    console.error('❌ aws-exports.js failed to load after 5 seconds');
    
    // Fallback to local import if window.awsmobile isn't available
    try {
      console.log('⚠️ Falling back to imported aws-exports.js...');
      const awsExports = await import('@/aws-exports');
      Amplify.configure(awsExports.default);
      console.log('✅ Amplify configured with imported aws-exports.js');
    } catch (err) {
      console.error('❌ Failed to configure Amplify:', err);
    }
  }
};

// 🖌️ Global styles & design tokens
import '@/styles/variables.css'; // CSS custom props (color, spacing, etc.)
import '@/styles/amplify-overrides.css'; // Amplify UI theme overrides
import '@/tailwind.css'; // Tailwind utilities
import '@aws-amplify/ui-react/styles.css'; // Amplify UI default styles

// 🚀 Your root App component
import App from '@/App';

// Configure Amplify before rendering
configureAmplify().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// Export critical functions to global window for testing
window.getSummary = getSummary;
window.getTimeline = getTimeline;
window.getDownloadUrl = getDownloadUrl;
window.sendApprovalEmail = sendApprovalEmail;
window.getProjectsByPM = getProjectsByPM;
window.getAllProjects = getAllProjects;
window.fetchWrapper = fetcher;
window.getAuthToken = getAuthToken;
