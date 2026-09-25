import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './ui/tokens.css';
import './index.css';
import './ui/primitives.css';
import './ui/shell.css';
import './ui/animations.css';
import './registerSW';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
