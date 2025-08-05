import '@/styles/variables.css';
import '@/styles/amplify-overrides.css';
import '@/tailwind.css';
import '@aws-amplify/ui-react/styles.css';

import { Amplify } from 'aws-amplify';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';

async function loadAwsConfig() {
  if ((window as any).awsmobile) return (window as any).awsmobile;

  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 5000);
    window.addEventListener(
      'awsmobile-loaded',
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { once: true }
    );
  });

  if ((window as any).awsmobile) return (window as any).awsmobile;

  const cfg = await import('@/aws-exports');
  return cfg.default || cfg;
}

async function init() {
  const config = await loadAwsConfig();
  Amplify.configure(config);

  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

init();
