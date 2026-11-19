import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './app/app';
import { getAppBaseUrl } from './app/core/utils';

const baseUrl = getAppBaseUrl();
if (window.location.pathname + '/' === baseUrl) {
  window.history.replaceState(window.history.state, '', baseUrl + window.location.search + window.location.hash);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
