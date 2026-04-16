import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ensureLatestVersion, startVersionPolling } from './lib/versionCheck'

// Render immediately - don't block on version check
createRoot(document.getElementById("root")!).render(<App />);

// Version check in background (non-blocking)
ensureLatestVersion(true);
startVersionPolling();
