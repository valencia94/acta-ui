// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

// 🔐 Amplify core import & configuration
import { Amplify } from 'aws-amplify';
import awsExports from '@/aws-exports';
Amplify.configure(awsExports);

// 🖌️ Global styles & design tokens
import '@/styles/variables.css';          // CSS custom props (color, spacing, etc.)
import '@/styles/amplify-overrides.css';  // Amplify UI theme overrides
import '@/tailwind.css';                  // Tailwind utilities
import '@aws-amplify/ui-react/styles.css';// Amplify UI default styles

// 🚀 Your root App component
import { App } from '@/components/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
