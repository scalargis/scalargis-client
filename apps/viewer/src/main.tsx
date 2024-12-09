import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './app/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
