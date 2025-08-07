import './tailwind.css';
import '@/styles/variables.css';
import '@/styles/amplify-overrides.css';
import '@aws-amplify/ui-react/styles.css';

import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';

let amplifyConfigured = false;

const configureAmplify = async () => {
  if (amplifyConfigured) return;

  try {
    const config = (window as any).awsmobile || awsExports;
    Amplify.configure(config);
    amplifyConfigured = true;
    console.log('✅ Amplify configured with:', config);
    console.log('Amplify Identity Pool:', config.aws_cognito_identity_pool_id);
  } catch (err) {
    console.error('❌ Amplify configuration failed:', err);
  }
};

async function init() {
  await configureAmplify();

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

init();
