import { AssessmentTypeKey, DomainScore, getAssessmentTypeDef, getNivelDisplay, SeniorityLevel } from "@/utils/scoring";
import {
  RADAR_MAX_VALUE,
  RADAR_RINGS,
  RADAR_SHORT_LABELS,
  radarPoint,
  radarPolygonPoints,
  radarTextAnchor
} from "@/utils/radar";

/**
 * Genera la imagen del mapa de competencias para compartir.
 *
 * No se serializa el <svg> que está en pantalla: ese pinta con clases de
 * Tailwind (stroke-border, fill-muted-foreground) que resuelven contra la hoja
 * de estilos del documento, y al rasterizar un SVG suelto esas clases no
 * existen — saldría un radar sin ejes ni etiquetas, y encima cambiaría de
 * colores según el tema del visitante. Acá se arma un SVG independiente con
 * hexadecimales explícitos y paleta clara fija, así la imagen se ve igual en
 * cualquier lado y sirve tanto en un feed claro como oscuro.
 */

const SIZE = 1200;
const CENTER = SIZE / 2;
const MARGIN = 88;
const MAX_RADIUS = 285;
const LABEL_RADIUS = MAX_RADIUS + 52;
const RADAR_CENTER_Y = 660;

// Paleta fija (no depende del tema del usuario): la imagen sale del sitio y se
// mira en LinkedIn, WhatsApp o donde sea.
const INK = "#18181b";
const MUTED = "#52525b";
const FAINT = "#a1a1aa";
const GRID = "#e4e4e7";
const BG = "#ffffff";
// El naranja de la marca (--primary del sitio). El acento de arriba cambia
// según el tipo de evaluación; el wordmark no: es lo que hace que la tarjeta se
// reconozca como de ProductPrepa aunque llegue suelta a un feed.
const BRAND = "#ef681a";

/** El mismo isotipo que muestran el sidebar y el header público. */
const LOGO_SRC = "/assets/sanguche.png";
const LOGO_SIZE = 84;
/** Cuánto se espera el logo antes de sacar la tarjeta sin él. */
const LOGO_TIMEOUT_MS = 3000;

/** Dónde vuelve quien ve la imagen: va impresa en el pie y en el texto del share. */
const SHARE_URL = "productprepa.com/evaluacion-product-manager";

const FONT = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

/** El texto va dentro de un documento XML: sin esto, un & en una etiqueta lo rompe. */
function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * El wordmark tal como está en el header del sitio: "Product" en el naranja de
 * la marca y "Prepa" en tinta.
 */
function wordmark(x: number, y: number, size: number): string {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${INK}">` +
    `<tspan fill="${BRAND}">Product</tspan>Prepa</text>`
  );
}

let logoDataUrl: Promise<string | null> | null = null;

/**
 * Trae el logo y lo devuelve en base64 para embeberlo en el SVG.
 *
 * No alcanza con apuntar el <image> a /assets/sanguche.png: el SVG se rasteriza
 * cargándolo como <img>, y en ese contexto el navegador no resuelve recursos
 * externos — el logo saldría vacío. Embebido en base64 el SVG queda
 * autocontenido, y al ser un data: URL tampoco tiñe el canvas, así que el
 * toBlob() posterior sigue funcionando.
 *
 * La promesa se cachea porque el archivo no cambia entre clicks (y para cuando
 * alguien llega a /mejoras el navegador ya lo tiene en caché: el sidebar lo
 * muestra en todas las pantallas).
 *
 * El pedido va acotado por timeout: fetch no tiene uno propio, y con la red
 * colgada (móvil sin señal, captive portal) se quedaría esperando minutos con
 * el botón girando. Antes de esto la tarjeta se armaba sin tocar la red, así
 * que el logo no puede ser lo que impida que salga.
 */
function loadLogoDataUrl(): Promise<string | null> {
  if (!logoDataUrl) {
    logoDataUrl = (async () => {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), LOGO_TIMEOUT_MS);
      try {
        // La señal corta tanto la conexión como la lectura del cuerpo.
        const response = await fetch(LOGO_SRC, { signal: abort.signal });
        if (!response.ok) throw new Error(`El logo respondió ${response.status}`);
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el logo"));
          reader.readAsDataURL(blob);
        });
      } finally {
        clearTimeout(timer);
      }
    })().catch((error) => {
      if (import.meta.env.DEV) console.warn("No se pudo embeber el logo en la imagen:", error);
      // Un fallo puntual de red (o un timeout) no tiene que dejar la tarjeta sin
      // logo para siempre: se limpia la caché y el próximo intento vuelve a probar.
      logoDataUrl = null;
      return null;
    });
  }
  return logoDataUrl;
}

interface RadarShareOptions {
  scores: DomainScore[];
  assessmentType: AssessmentTypeKey | null;
  nivel: SeniorityLevel;
  promedioGlobal: number;
  /** Fecha de la evaluación, para fechar la foto del momento. */
  updatedAt?: string | null;
}

interface RadarCardOptions extends RadarShareOptions {
  /** Logo en base64. Si no llegó, la tarjeta se arma igual con solo el wordmark. */
  logo?: string | null;
}

const TITLES: Record<AssessmentTypeKey, string> = {
  experimentado: "Mi mapa de competencias",
  sin_experiencia: "Mi mapa de afinidad",
  builder: "Mi mapa de competencias",
  lider: "El mapa de mi equipo"
};

/** Arma el SVG completo de la tarjeta, listo para rasterizar. */
export function buildRadarShareSvg({
  scores,
  assessmentType,
  nivel,
  promedioGlobal,
  updatedAt,
  logo
}: RadarCardOptions): string {
  const total = scores.length;
  const typeDef = getAssessmentTypeDef(assessmentType);
  const accent = typeDef.accent.hex;
  const nivelDisplay = getNivelDisplay(assessmentType, nivel);
  const title = TITLES[assessmentType ?? "experimentado"];

  const fecha = updatedAt
    ? new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(updatedAt))
    : "";

  // Todo el radar se dibuja alrededor de (CENTER, CENTER) y después el grupo
  // entero se baja hasta su lugar en la tarjeta: una sola convención de
  // coordenadas, en vez de sumarle el offset a mano a cada elemento.
  const rings = RADAR_RINGS.map((ring) => {
    const points = radarPolygonPoints(total, (ring / RADAR_MAX_VALUE) * MAX_RADIUS, CENTER);
    const width = ring === RADAR_RINGS.length ? 2.5 : 1.5;
    return `<polygon points="${points}" fill="none" stroke="${GRID}" stroke-width="${width}"/>`;
  }).join("");

  const axes = scores
    .map((_, i) => {
      const p = radarPoint(i, total, MAX_RADIUS, CENTER);
      return `<line x1="${CENTER}" y1="${CENTER}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${GRID}" stroke-width="1.5"/>`;
    })
    .join("");

  const dataPolygon = radarPolygonPoints(total, MAX_RADIUS, CENTER, (i) => scores[i].value);

  const dots = scores
    .map((s, i) => {
      const p = radarPoint(i, total, (s.value / RADAR_MAX_VALUE) * MAX_RADIUS, CENTER);
      return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7" fill="${accent}"/>`;
    })
    .join("");

  const labels = scores
    .map((s, i) => {
      const p = radarPoint(i, total, LABEL_RADIUS, CENTER);
      const label = RADAR_SHORT_LABELS[s.key] ?? s.label;
      return (
        `<text x="${p.x.toFixed(1)}" y="${(p.y + 8).toFixed(1)}" ` +
        `text-anchor="${radarTextAnchor(i, total)}" font-family="${FONT}" font-size="24" ` +
        `fill="${MUTED}">${escapeXml(label)}</text>`
      );
    })
    .join("");

  // Escala sobre el eje vertical, igual que en pantalla.
  const scale = RADAR_RINGS.map((ring) => {
    const y = CENTER - (ring / RADAR_MAX_VALUE) * MAX_RADIUS + 8;
    return `<text x="${CENTER + 12}" y="${y.toFixed(1)}" font-family="${FONT}" font-size="18" fill="${FAINT}">${ring}</text>`;
  }).join("");

  const subtitle = `${nivelDisplay.title}: ${nivelDisplay.label}  ·  Promedio ${promedioGlobal} / 5`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <rect width="${SIZE}" height="12" fill="${accent}"/>

  ${logo ? `<image x="${MARGIN}" y="42" width="${LOGO_SIZE}" height="${LOGO_SIZE}" href="${logo}" preserveAspectRatio="xMidYMid meet"/>` : ""}
  ${wordmark(logo ? MARGIN + LOGO_SIZE + 20 : MARGIN, 98, 40)}
  <text x="${MARGIN}" y="200" font-family="${FONT}" font-size="54" font-weight="700" fill="${INK}">${escapeXml(title)}</text>
  <text x="${MARGIN}" y="254" font-family="${FONT}" font-size="28" fill="${MUTED}">${escapeXml(subtitle)}</text>

  <g transform="translate(0 ${RADAR_CENTER_Y - CENTER})">
    ${rings}${axes}${scale}
    <polygon points="${dataPolygon}" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-width="4" stroke-linejoin="round"/>
    ${dots}
    ${labels}
  </g>

  <line x1="${MARGIN}" y1="1060" x2="${SIZE - MARGIN}" y2="1060" stroke="${GRID}" stroke-width="2"/>
  ${wordmark(MARGIN, 1112, 32)}
  <text x="${MARGIN}" y="1152" font-family="${FONT}" font-size="24" fill="${MUTED}">${SHARE_URL}</text>
  ${fecha ? `<text x="${SIZE - MARGIN}" y="1112" text-anchor="end" font-family="${FONT}" font-size="24" fill="${FAINT}">${escapeXml(fecha)}</text>` : ""}
</svg>`;
}

/**
 * Rasteriza el SVG a PNG. `scale` 2 deja una imagen de 2400px, que es lo que
 * necesita LinkedIn para no verse borrosa en pantallas retina.
 */
async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  // encodeURIComponent y no btoa: los labels tienen acentos y btoa explota con
  // cualquier carácter fuera de latin1.
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo renderizar el SVG del radar"));
    img.src = source;
  });

  const canvas = document.createElement("canvas");
  canvas.width = SIZE * scale;
  canvas.height = SIZE * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no expone un contexto 2D de canvas");

  ctx.scale(scale, scale);
  // El SVG ya trae su fondo, pero un PNG sin fondo explícito queda transparente
  // si el render del SVG falla parcialmente.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(image, 0, 0, SIZE, SIZE);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar el PNG"))),
      "image/png"
    );
  });
}

export const RADAR_IMAGE_FILENAME = "mi-mapa-de-competencias-productprepa.png";

/** Qué terminó pasando, para que la UI avise lo correcto. */
export type ShareOutcome = "shared" | "downloaded" | "cancelled";

/**
 * Si el dispositivo se maneja con el dedo.
 *
 * No alcanza con preguntar si el navegador sabe compartir archivos: Chrome en
 * macOS dice que sí, pero lo que llega del otro lado es peor que un archivo
 * bajado a mano. Compartiendo a WhatsApp desde ahí, la imagen entra duplicada
 * (como álbum de dos, y recortada al centro, que se come el encabezado y el
 * pie) y el mensaje arranca con la ruta del temporal de Chrome pegada al
 * texto. En desktop el PNG descargado y adjuntado a mano sale limpio; la hoja
 * nativa se gana su lugar en el teléfono, que es donde no hay alternativa.
 */
function isHandheld(): boolean {
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

/**
 * En mobile abre la hoja nativa de compartir (que es donde realmente se
 * comparte); en desktop descarga el PNG para adjuntarlo a mano.
 */
export async function shareOrDownloadRadar(options: RadarShareOptions): Promise<ShareOutcome> {
  const logo = await loadLogoDataUrl();
  const blob = await svgToPngBlob(buildRadarShareSvg({ ...options, logo }));
  const file = new File([blob], RADAR_IMAGE_FILENAME, { type: "image/png" });

  if (isHandheld() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Mi mapa de competencias en Producto",
        // La URL va suelta al final para que WhatsApp la deje clickeable: en la
        // imagen está impresa, pero desde ahí nadie la puede tocar.
        text: `Hice la evaluación de ProductPrepa y este es mi mapa de competencias. https://${SHARE_URL}`
      });
      return "shared";
    } catch (error) {
      // Cerrar la hoja de compartir no es un error que valga la pena mostrar.
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Cualquier otra falla del share cae a la descarga, que siempre funciona.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = RADAR_IMAGE_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
