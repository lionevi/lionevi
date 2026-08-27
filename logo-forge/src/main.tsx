import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { detectLocale, setLocale } from '@/i18n';
import { App } from '@ui/App';
import { AppProvider } from '@ui/state/store';
import '@ui/styles/theme.css';

setLocale(detectLocale(navigator?.language));

const container = document.getElementById('root');
if (!container) throw new Error('Point de montage « #root » introuvable dans le panneau.');

createRoot(container).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
