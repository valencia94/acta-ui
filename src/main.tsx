import './tailwind.css';
import '@/styles/variables.css';
import '@/styles/amplify-overrides.css';
import '@aws-amplify/ui-react/styles.css';

import { Amplify, fetchAuthSession, getCredentials } from 'aws-amplify';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';

import awsExports from './aws-exports';

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

const initializeIdentity = async () => {
  try {
    await fetchAuthSession();
    const credentials = await getCredentials();
    console.log('🧠 Identity ID:', credentials?.identityId);
    (window as any).identityId = credentials?.identityId;
  } catch (err) {
    console.error('❌ Identity resolution failed', err);
  }
};

async function init() {
  await configureAmplify();
  await initializeIdentity();

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

init();
