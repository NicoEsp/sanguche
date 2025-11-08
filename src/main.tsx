import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ensureLatestVersion, startVersionPolling } from './lib/versionCheck'

// Check for new version before rendering
await ensureLatestVersion(true);

createRoot(document.getElementById("root")!).render(<App />);

// Start polling for version updates every 5 minutes
startVersionPolling();
