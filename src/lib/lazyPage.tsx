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

  const Page = () => {
    // Se decide una vez por montaje: cambiar de lazy a Loaded en un re-render
    // cambiaría el tipo del elemento y remontaría la página entera. Es un lazy
    // nuevo por montaje porque React.lazy guarda el rechazo para siempre: con
    // uno compartido, "Reintentar" en el ErrorBoundary volvía a fallar sin
    // pedir el chunk otra vez.
    const [Component] = useState<ComponentType>(
      () => Loaded ?? lazy(() => preload().then(() => ({ default: Loaded! })))
    );
    return <Component />;
  };

  return Object.assign(Page, { preload });
}
