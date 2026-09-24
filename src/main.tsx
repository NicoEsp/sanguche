import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startVersionWatcher } from './lib/versionCheck'

createRoot(document.getElementById("root")!).render(<App />);

startVersionWatcher();
