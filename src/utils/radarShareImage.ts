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

interface RadarShareOptions {
  scores: DomainScore[];
  assessmentType: AssessmentTypeKey | null;
  nivel: SeniorityLevel;
  promedioGlobal: number;
  /** Fecha de la evaluación, para fechar la foto del momento. */
  updatedAt?: string | null;
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
  updatedAt
}: RadarShareOptions): string {
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

  <text x="88" y="112" font-family="${FONT}" font-size="22" font-weight="700" letter-spacing="5" fill="${accent}">PRODUCTPREPA</text>
  <text x="88" y="186" font-family="${FONT}" font-size="54" font-weight="700" fill="${INK}">${escapeXml(title)}</text>
  <text x="88" y="242" font-family="${FONT}" font-size="28" fill="${MUTED}">${escapeXml(subtitle)}</text>

  <g transform="translate(0 ${RADAR_CENTER_Y - CENTER})">
    ${rings}${axes}${scale}
    <polygon points="${dataPolygon}" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-width="4" stroke-linejoin="round"/>
    ${dots}
    ${labels}
  </g>

  <line x1="88" y1="1080" x2="${SIZE - 88}" y2="1080" stroke="${GRID}" stroke-width="2"/>
  <text x="88" y="1136" font-family="${FONT}" font-size="26" fill="${MUTED}">productprepa.com/evaluacion-product-manager</text>
  ${fecha ? `<text x="${SIZE - 88}" y="1136" text-anchor="end" font-family="${FONT}" font-size="24" fill="${FAINT}">${escapeXml(fecha)}</text>` : ""}
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
 * En mobile abre la hoja nativa de compartir (que es donde realmente se
 * comparte); en desktop, donde el Web Share API con archivos casi no existe,
 * descarga el PNG.
 */
export async function shareOrDownloadRadar(options: RadarShareOptions): Promise<ShareOutcome> {
  const blob = await svgToPngBlob(buildRadarShareSvg(options));
  const file = new File([blob], RADAR_IMAGE_FILENAME, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Mi mapa de competencias en Producto",
        text: "Hice la evaluación de ProductPrepa y este es mi mapa de competencias."
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
