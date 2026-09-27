import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './i18n';
import './ui/tokens.css';
import './ui/theme-light.css';
import './index.css';
import './ui/primitives.css';
import './ui/shell.css';
import './ui/animations.css';
import './ui/theme-toggle.css';
import './registerSW';
import { ThemeProvider } from './theme/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

