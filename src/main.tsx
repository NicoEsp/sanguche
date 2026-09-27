import { createRoot } from 'react-dom/client'
import type { Session } from '@supabase/supabase-js'
import App from './App.tsx'
import { preloadRoute } from './routes'
import './index.css'
import { supabase } from './integrations/supabase/client'
import { startVersionWatcher } from './lib/versionCheck'

const container = document.getElementById("root")!;

const render = (initialSession?: Session | null) =>
  createRoot(container).render(<App initialSession={initialSession} />);

// El chunk de la página arranca ya, en paralelo con todo lo demás.
const pageReady = preloadRoute(window.location.pathname);

if (container.childElementCount > 0) {
  // El build dejó la página en el #root. El primer render espera el chunk y la
  // sesión, y mientras tanto se sigue viendo ese HTML: así React lo reemplaza
  // directo por la página, sin pasar por el spinner de Suspense ni por el de
  // la sesión. Si algo falla se renderiza igual y cada parte se recupera sola.
  Promise.all([pageReady, supabase.auth.getSession()]).then(
    ([, { data }]) => render(data.session),
    () => render()
  );
} else {
  render();
}

startVersionWatcher();
