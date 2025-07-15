// src/main.tsx

// 🔐 AWS Amplify Setup
import { Amplify } from 'aws-amplify';
import awsExports from '@/aws-exports';

// 🎨 Global Styles
import '@/styles/variables.css';            // Design tokens (colors, spacing)
import '@/styles/amplify-overrides.css';    // Amplify UI overrides
import '@/tailwind.css';                    // Tailwind utilities
import '@aws-amplify/ui-react/styles.css';  // Amplify UI base styles

// ⚛️ React & App
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';

Amplify.configure(awsExports);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
