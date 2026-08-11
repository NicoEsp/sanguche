import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ensureLatestVersion, startVersionPolling } from './lib/versionCheck'
import { captureAttribution } from './lib/attribution'

// Antes de cualquier render: la app puede redirigir apenas monta (useHomeRedirect)
// y con eso se perderían los UTMs de la URL de aterrizaje.
captureAttribution();

// Render immediately - don't block on version check
createRoot(document.getElementById("root")!).render(<App />);

// Version check in background (non-blocking)
ensureLatestVersion(true);
startVersionPolling();
