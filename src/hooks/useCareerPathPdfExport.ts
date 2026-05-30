import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface ExportTrackingPayload {
  objectives_count: number;
  completion_rate: number;
  completed_objectives: number;
  is_locked: boolean;
}

interface UseCareerPathPdfExportOptions {
  trackEvent: (event: string, properties?: Record<string, unknown>) => void;
  getTrackingPayload: () => ExportTrackingPayload;
}

const PRINT_STYLES = `
  @media screen {
    [data-career-path-print] {
      display: none !important;
    }
  }

  @media print {
    @page {
      margin: 16mm;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
    }

    body > :not(#career-path-print-root) {
      display: none !important;
    }

    #career-path-print-root {
      display: block !important;
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    #career-path-print-root .print\\:hidden,
    #career-path-print-root [class*="print:hidden"] {
      display: none !important;
    }

    /* Stack the 3 stage columns vertically so cards fit and paginate cleanly */
    #career-path-print-root .career-path-column {
      display: block !important;
      width: 100% !important;
      min-height: 0 !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      margin-bottom: 16px !important;
      padding: 16px !important;
      page-break-inside: auto;
      break-inside: auto;
    }

    /* Keep each card together when possible */
    #career-path-print-root .career-path-card-wrapper,
    #career-path-print-root .career-path-card {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Unwrap scroll viewports so all content prints */
    #career-path-print-root [data-radix-scroll-area-viewport],
    #career-path-print-root [data-radix-scroll-area-root] {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }

    #career-path-print-root [data-radix-scroll-area-scrollbar] {
      display: none !important;
    }

    /* The kanban wrapper: drop the rounded card chrome and let columns flow */
    #career-path-print-root .career-path-canvas-shell {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background: transparent !important;
      backdrop-filter: none !important;
    }

    #career-path-print-root .career-path-canvas-shell > div {
      display: block !important;
      grid-template-columns: none !important;
      gap: 0 !important;
    }
  }
`;

export function useCareerPathPdfExport({
  trackEvent,
  getTrackingPayload,
}: UseCareerPathPdfExportOptions) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = useCallback(() => {
    const exportNode = exportRef.current;

    if (!exportNode) {
      toast.error("No pudimos preparar tu Career Path para exportarlo.");
      return;
    }

    trackEvent("career_path_pdf_exported", getTrackingPayload());

    setIsExportingPdf(true);

    try {
      const clonedNode = exportNode.cloneNode(true) as HTMLElement;
      const printRoot = document.createElement("div");
      const styleTag = document.createElement("style");
      const cleanupCallbacks: (() => void)[] = [];
      let cleanedUp = false;

      printRoot.id = "career-path-print-root";
      printRoot.setAttribute("data-career-path-print", "true");
      printRoot.appendChild(clonedNode);

      styleTag.id = "career-path-print-styles";
      styleTag.textContent = PRINT_STYLES;

      document.body.appendChild(printRoot);
      document.head.appendChild(styleTag);

      const finalize = () => {
        if (cleanedUp) return;
        cleanedUp = true;

        cleanupCallbacks.forEach((fn) => fn());
        printRoot.remove();
        styleTag.remove();
        setIsExportingPdf(false);
        toast.success('Usá la opción "Guardar como PDF" para descargar tu Career Path.');
      };

      const afterPrintHandler = () => finalize();

      if (typeof window.matchMedia === "function") {
        const mediaQueryList = window.matchMedia("print");

        if (mediaQueryList.addEventListener) {
          const listener = (event: MediaQueryListEvent) => {
            if (!event.matches) finalize();
          };
          mediaQueryList.addEventListener("change", listener);
          cleanupCallbacks.push(() =>
            mediaQueryList.removeEventListener("change", listener)
          );
        } else if (mediaQueryList.addListener) {
          const legacyListener = (event: MediaQueryListEvent) => {
            if (!event.matches) finalize();
          };
          mediaQueryList.addListener(legacyListener);
          cleanupCallbacks.push(() => mediaQueryList.removeListener(legacyListener));
        }
      }

      window.addEventListener("afterprint", afterPrintHandler, { once: true });
      cleanupCallbacks.push(() =>
        window.removeEventListener("afterprint", afterPrintHandler)
      );

      const fallbackTimeout = window.setTimeout(() => finalize(), 60000);
      cleanupCallbacks.push(() => window.clearTimeout(fallbackTimeout));

      requestAnimationFrame(() => {
        window.focus();
        window.print();
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error exporting Career Path as PDF:", error);
      }
      document.getElementById("career-path-print-root")?.remove();
      document.getElementById("career-path-print-styles")?.remove();
      toast.error("No pudimos exportar tu Career Path. Intentá nuevamente.");
      setIsExportingPdf(false);
    }
  }, [trackEvent, getTrackingPayload]);

  return {
    exportRef,
    isExportingPdf,
    handleExportPdf,
  };
}
