/**
 * @file main.tsx
 * Browser entry point: loads shared design tokens, fonts, base and app styles,
 * then mounts the app.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@portfolio/design-tokens/tokens.css';
import '@portfolio/design-tokens/fonts.css';
import '@portfolio/design-tokens/base.css';
import './styles/app.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
