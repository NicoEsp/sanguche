import { ComponentType, lazy, useState } from "react";

type PageModule = { default: ComponentType };

export type LazyPage = ComponentType & { preload: () => Promise<void> };

/**
 * React.lazy con precarga.
 *
 * React.lazy suspende en el primer render aunque el módulo ya esté descargado,
 * y eso muestra el fallback de Suspense por lo menos un frame. Esta versión, si
 * preload() ya resolvió, renderiza la página directo. main.tsx lo usa para que
 * el primer render de una página prerenderizada reemplace ese HTML por la
 * página y no por el spinner.
 */
export function lazyPage(factory: () => Promise<PageModule>): LazyPage {
  let Loaded: ComponentType | undefined;
  let loading: Promise<void> | undefined;

  const preload = () => {
    loading ??= factory().then(
      (module) => {
        Loaded = module.default;
      },
      (error) => {
        // Sin esto, un chunk que falló una vez (red caída) no se reintentaría nunca.
        loading = undefined;
        throw error;
      }
    );
    return loading;
  };

  // Un solo lazy por página. Después de un rechazo React vuelve a montar la
  // página desde cero: con un lazy por montaje cada montaje pedía el chunk otra
  // vez y uno que falla siempre dejaba la página en el spinner, en un loop. Con
  // uno compartido el rechazo queda guardado y llega al ErrorBoundary. Ahí
  // "Reintentar" no alcanza porque Chrome tampoco vuelve a pedir un import()
  // que falló; lo que recupera es "Recargar página".
  const Lazy = lazy(() => preload().then(() => ({ default: Loaded! })));

  const Page = () => {
    // Se decide una vez por montaje: cambiar de Lazy a Loaded en un re-render
    // cambiaría el tipo del elemento y remontaría la página entera.
    const [Component] = useState<ComponentType>(() => Loaded ?? Lazy);
    return <Component />;
  };

  return Object.assign(Page, { preload });
}
