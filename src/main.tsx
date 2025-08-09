import '@/styles/variables.css';
import '@/tailwind.css';
import '@/styles/amplify-overrides.css';
import '@aws-amplify/ui-react/styles.css';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';

import awsExports from './aws-exports';

declare global {
  interface Window {
  debugAuth?: () => Promise<void>;
  }
}

window.debugAuth = async () => {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
  // eslint-disable-next-line no-console
  console.log('🧠 Auth Session:', session);
  // eslint-disable-next-line no-console
  console.log('🧠 Identity ID:', (session?.credentials as any)?.identityId);
  } catch (err) {
  // eslint-disable-next-line no-console
  console.error('❌ Auth debug failed:', err);
  }
};

let amplifyConfigured = false;

const configureAmplify = async (): Promise<void> => {
  if (amplifyConfigured) return;

  // Wait up to 5s for window.awsmobile to be injected
  const start = Date.now();
  while (!(window as any).awsmobile && Date.now() - start < 5000) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  try {
    const config = (window as any).awsmobile || awsExports;
    Amplify.configure(config);
    amplifyConfigured = true;
    // eslint-disable-next-line no-console
    console.log('✅ Amplify configured with:', config);
    const session = await fetchAuthSession().catch(() => null);
    // eslint-disable-next-line no-console
    console.log('Amplify Identity Pool:', config.aws_cognito_identity_pool_id);
    // eslint-disable-next-line no-console
    console.log('🧠 Identity ID:', (session?.credentials as any)?.identityId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Amplify configuration failed:', err);
  }
};

async function init(): Promise<void> {
  await configureAmplify();

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ChakraProvider value={defaultSystem}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </React.StrictMode>
  );
}

void init();
