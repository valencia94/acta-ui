import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';

import awsmobile from './aws-exports';
import App from './App';

import '@aws-amplify/ui-react/styles.css';
import './tailwind.css';
import './styles/variables.css';

// 🔐 Configure Amplify with environment-specific settings
Amplify.configure(awsmobile);

// 🚀 Render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
