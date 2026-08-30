import { AnyDomainKey } from "@/utils/scoring";

/**
 * Geometría y etiquetas del radar de competencias.
 *
 * Vive acá y no dentro de CompetencyRadar porque hay dos consumidores que
 * tienen que dibujar exactamente el mismo polígono: el componente en pantalla
 * y el SVG que se rasteriza a PNG para compartir (utils/radarShareImage.ts).
 * Si cada uno hiciera su propia trigonometría, la imagen descargada podría
 * dejar de coincidir con lo que la persona ve y nadie se enteraría.
 */

/** Etiquetas cortas para los vértices: los labels completos no entran alrededor del polígono. */
export const RADAR_SHORT_LABELS: Record<AnyDomainKey, string> = {
  estrategia: "Estrategia",
  roadmap: "Roadmap",
  ejecucion: "Ejecución",
  discovery: "Discovery",
  analitica: "Analítica",
  ux: "UX",
  stakeholders: "Stakeholders",
  comunicacion: "Comunicación",
  liderazgo: "Liderazgo",
  tecnico: "Técnico",
  monetizacion: "Monetización",
  growth: "Growth",
  ia_aplicada: "IA aplicada"
};

/** Puntaje máximo de cualquier dominio: define el radio del anillo externo. */
export const RADAR_MAX_VALUE = 5;

/** Los cinco anillos de referencia, de adentro hacia afuera. */
export const RADAR_RINGS = [1, 2, 3, 4, 5];

/** Ángulo del vértice `index`: arranca arriba (-90°) y avanza en sentido horario. */
function angleAt(index: number, total: number): number {
  return (Math.PI * 2 * index) / total - Math.PI / 2;
}

/** Coordenada del vértice `index` a `radius` del centro, en un radar de `total` ejes. */
export function radarPoint(
  index: number,
  total: number,
  radius: number,
  center: number
): { x: number; y: number } {
  const angle = angleAt(index, total);
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle)
  };
}

/**
 * Alineación de la etiqueta según de qué lado del radar cae el vértice, para
 * que el texto crezca hacia afuera y no se monte sobre el polígono.
 */
export function radarTextAnchor(index: number, total: number): "start" | "middle" | "end" {
  const cos = Math.cos(angleAt(index, total));
  if (cos > 0.25) return "start";
  if (cos < -0.25) return "end";
  return "middle";
}

/** Los vértices de un polígono a `radius`, ya formateados para el atributo `points`. */
export function radarPolygonPoints(
  total: number,
  radius: number,
  center: number,
  valueAt?: (index: number) => number
): string {
  return Array.from({ length: total }, (_, i) => {
    const r = valueAt ? (valueAt(i) / RADAR_MAX_VALUE) * radius : radius;
    const p = radarPoint(i, total, r, center);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}
