import '@/styles/variables.css';
import '@/styles/amplify-overrides.css';
import '@/tailwind.css';
import '@aws-amplify/ui-react/styles.css';

import { Amplify } from 'aws-amplify';

import awsExports from './aws-exports';

Amplify.configure(awsExports);

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
