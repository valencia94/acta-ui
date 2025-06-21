import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';

import awsmobile from './aws-exports';

Amplify.configure(awsmobile);

import '@aws-amplify/ui-react/styles.css';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import './tailwind.css';
import './styles/variables.css';
