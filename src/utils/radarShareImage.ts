import {
  AssessmentTypeKey,
  DomainScore,
  getAssessmentTypeDef,
  getDomainStatus,
  getNivelDisplay,
  SeniorityLevel
} from "@/utils/scoring";
import {
  RADAR_MAX_VALUE,
  RADAR_RINGS,
  RADAR_SHORT_LABELS,
  radarPoint,
  radarPolygonPoints,
  radarTextAnchor
} from "@/utils/radar";
import { evalUrl, SHORT_EVAL_URL } from "@/constants/shareLinks";
import { copyText } from "@/utils/clipboard";

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

/**
 * Qué evaluación se tomó, nombrada para que la entienda alguien de afuera.
 *
 * "Madurez de método" o "Mi mapa de competencias" no le dicen nada a quien se
 * cruza la imagen en un feed sin haber pasado nunca por acá: falta el nombre de
 * la cosa. Redactadas para caber en las dos frases donde se usan: debajo del
 * título de la tarjeta ("Evaluación de …") y en el texto del posteo ("Hice la
 * evaluación de … de ProductPrepa").
 */
const EVALUATION_NAMES: Record<AssessmentTypeKey, string> = {
  experimentado: "competencias en Producto",
  sin_experiencia: "afinidad con Producto",
  builder: "Product Builder",
  lider: "madurez de equipos de Producto"
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

  const evaluationName = `Evaluación de ${EVALUATION_NAMES[assessmentType ?? "experimentado"]}`;
  const subtitle = `${nivelDisplay.title}: ${nivelDisplay.label}  ·  Promedio ${promedioGlobal} / 5`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <rect width="${SIZE}" height="12" fill="${accent}"/>

  ${logo ? `<image x="${MARGIN}" y="42" width="${LOGO_SIZE}" height="${LOGO_SIZE}" href="${logo}" preserveAspectRatio="xMidYMid meet"/>` : ""}
  ${wordmark(logo ? MARGIN + LOGO_SIZE + 20 : MARGIN, 98, 40)}
  <text x="${MARGIN}" y="196" font-family="${FONT}" font-size="54" font-weight="700" fill="${INK}">${escapeXml(title)}</text>
  <text x="${MARGIN}" y="242" font-family="${FONT}" font-size="28" font-weight="500" fill="${INK}">${escapeXml(evaluationName)}</text>
  <text x="${MARGIN}" y="286" font-family="${FONT}" font-size="26" fill="${MUTED}">${escapeXml(subtitle)}</text>

  <g transform="translate(0 ${RADAR_CENTER_Y - CENTER})">
    ${rings}${axes}${scale}
    <polygon points="${dataPolygon}" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-width="4" stroke-linejoin="round"/>
    ${dots}
    ${labels}
  </g>

  <line x1="${MARGIN}" y1="1046" x2="${SIZE - MARGIN}" y2="1046" stroke="${GRID}" stroke-width="2"/>
  ${wordmark(MARGIN, 1084, 32)}
  ${fecha ? `<text x="${SIZE - MARGIN}" y="1084" text-anchor="end" font-family="${FONT}" font-size="24" fill="${FAINT}">${escapeXml(fecha)}</text>` : ""}
  <text x="${MARGIN}" y="1118" font-family="${FONT}" font-size="24" fill="${MUTED}">Hacé la tuya gratis</text>
  <text x="${MARGIN}" y="1152" font-family="${FONT}" font-size="30" font-weight="700" fill="${BRAND}">${SHORT_EVAL_URL}</text>
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

/**
 * El texto sugerido para acompañar la imagen en LinkedIn.
 *
 * Existe por una limitación de la tarjeta: la URL está impresa, pero nadie
 * puede hacerle click desde un feed. Poniéndola en el texto que se pega junto a
 * la imagen el link vuelve a ser un link, sin necesidad de ninguna
 * infraestructura nueva, y encima se puede atribuir por UTM —cosa que la imagen
 * sola nunca va a permitir—.
 */
export function buildRadarShareText({
  scores,
  assessmentType,
  promedioGlobal
}: Pick<RadarShareOptions, "scores" | "assessmentType" | "promedioGlobal">): string {
  const evaluacion = EVALUATION_NAMES[assessmentType ?? "experimentado"];

  // El dominio más flojo, y sólo si de verdad es una brecha: anunciar como
  // "la brecha más grande" un dominio en 4/5 haría quedar mal a la persona por
  // algo que no está mal.
  const weakest = scores.length
    ? scores.reduce((min, s) => (s.value < min.value ? s : min))
    : null;
  const brecha =
    weakest && getDomainStatus(weakest.value) !== "fortaleza"
      ? `, con ${RADAR_SHORT_LABELS[weakest.key] ?? weakest.label} como la brecha más grande`
      : "";

  return (
    `Hice la evaluación de ${evaluacion} de ProductPrepa. ` +
    `Promedio ${promedioGlobal.toFixed(1)} sobre 5${brecha}.\n\n` +
    `La podés hacer gratis acá: ${evalUrl("radar_share")}`
  );
}

/** Qué terminó pasando, para que la UI avise lo correcto. */
export type ShareOutcome = "shared" | "downloaded" | "cancelled";

export type ShareResult = {
  outcome: ShareOutcome;
  /**
   * Si además quedó en el portapapeles el texto del posteo. Es best effort: el
   * portapapeles necesita permiso y activación reciente del usuario, y para
   * cuando el PNG está rasterizado puede haberse perdido. Que falle no tiene
   * que arruinar la descarga, pero el aviso sí tiene que decir la verdad.
   */
  textCopied: boolean;
};

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
 * comparte); en desktop descarga el PNG y deja el texto del posteo en el
 * portapapeles, que es el equivalente de escritorio de esa hoja: la persona
 * adjunta la imagen y pega el texto con el link.
 */
export async function shareOrDownloadRadar(options: RadarShareOptions): Promise<ShareResult> {
  const logo = await loadLogoDataUrl();
  const blob = await svgToPngBlob(buildRadarShareSvg({ ...options, logo }));
  const file = new File([blob], RADAR_IMAGE_FILENAME, { type: "image/png" });
  const text = buildRadarShareText(options);

  if (isHandheld() && navigator.canShare?.({ files: [file] })) {
    try {
      // El texto viaja dentro de la hoja nativa: acá no hace falta el
      // portapapeles, la app de destino ya lo recibe pegado a la imagen.
      await navigator.share({ files: [file], title: "Mi mapa de competencias en Producto", text });
      return { outcome: "shared", textCopied: false };
    } catch (error) {
      // Cerrar la hoja de compartir no es un error que valga la pena mostrar.
      if (error instanceof DOMException && error.name === "AbortError") {
        return { outcome: "cancelled", textCopied: false };
      }
      // Cualquier otra falla del share cae a la descarga, que siempre funciona.
    }
  }

  downloadBlob(blob, RADAR_IMAGE_FILENAME);

  let textCopied = false;
  try {
    await copyText(text);
    textCopied = true;
  } catch (error) {
    if (import.meta.env.DEV) console.warn("No se pudo copiar el texto del posteo:", error);
  }

  return { outcome: "downloaded", textCopied };
}

/**
 * Baja un blob con el nombre que le corresponde.
 *
 * El ancla tiene que estar en el documento para que Firefox respete el click, y
 * el object URL no se puede revocar en la misma vuelta: hacerlo antes de que el
 * navegador termine de leer el blob aborta la descarga o la deja sin nombre, y
 * el archivo aparece como "download" en el chat de quien lo recibe.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
