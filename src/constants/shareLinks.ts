import { SITE_URL } from "@/seo/contentSeo";

/**
 * Los links que salen de la plataforma cuando alguien comparte su radar.
 *
 * Están juntos porque el mismo destino se imprime en tres superficies distintas
 * —la tarjeta PNG, el texto de posteo y el Markdown para el LLM— y cada una lo
 * necesita en un formato: una para leerse de un vistazo, las otras dos para
 * poder atribuir la visita.
 */

/** El host sin esquema: es lo único que entra prolijo en el pie de la tarjeta. */
const HOST = SITE_URL.replace(/^https?:\/\//, "");

/** Ruta corta de la evaluación. Redirige a /evaluacion-product-manager desde vercel.json. */
const EVAL_PATH = "/eval";

/**
 * La URL corta tal como se imprime en la imagen.
 *
 * La tarjeta es la única superficie del feature que no deja rastro: quien la ve
 * en un feed tiene que poder tipearla de memoria, y
 * `productprepa.com/evaluacion-product-manager` no se memoriza.
 */
export const SHORT_EVAL_URL = `${HOST}${EVAL_PATH}`;

/**
 * Desde dónde salió el link. Sirve para comparar las dos mitades del feature
 * —el Markdown que se pega en un LLM y el texto que acompaña a la imagen— y
 * poder dar de baja la que no rinda.
 */
export type ShareSurface = "export_md" | "radar_share";

const UTM_MEDIUM: Record<ShareSurface, string> = {
  export_md: "llm",
  radar_share: "social"
};

/** Campaña única del feature: las dos superficies se comparan dentro de ella. */
const UTM_CAMPAIGN = "radar_share";

/**
 * Cuál de los links se clickeó, cuando una superficie tiene más de uno.
 *
 * El pie del Markdown lleva dos que caen en la misma campaña y la misma
 * superficie: la firma de marca ("generado en ProductPrepa") y la invitación a
 * hacer la propia evaluación. Sin esto son indistinguibles en el reporte, y son
 * dos intenciones muy distintas: una es curiosidad por quién hizo esto, la otra
 * es alguien que se quiere evaluar.
 */
export type ShareContent = "brand" | "cta";

/** URL absoluta de `path` etiquetada con la superficie desde la que se comparte. */
export function withShareUtm(path: string, surface: ShareSurface, content?: ShareContent): string {
  const params = new URLSearchParams({
    utm_source: surface,
    utm_medium: UTM_MEDIUM[surface],
    utm_campaign: UTM_CAMPAIGN
  });
  if (content) params.set("utm_content", content);
  return `${SITE_URL}${path}?${params.toString()}`;
}

/** La evaluación, etiquetada según desde dónde se comparte. */
export function evalUrl(surface: ShareSurface, content?: ShareContent): string {
  return withShareUtm(EVAL_PATH, surface, content);
}

/** La home, etiquetada igual: es el otro link del pie del Markdown. */
export function homeUrl(surface: ShareSurface, content?: ShareContent): string {
  return withShareUtm("/", surface, content);
}
