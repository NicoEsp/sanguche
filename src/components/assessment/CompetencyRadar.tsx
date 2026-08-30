import { DomainScore } from "@/utils/scoring";
import {
  RADAR_MAX_VALUE,
  RADAR_RINGS,
  RADAR_SHORT_LABELS,
  radarPoint,
  radarPolygonPoints,
  radarTextAnchor
} from "@/utils/radar";

interface CompetencyRadarProps {
  scores: DomainScore[];
  accentHex: string;
  className?: string;
}

const CENTER = 200;
const MAX_RADIUS = 132;
const LABEL_RADIUS = MAX_RADIUS + 22;

/**
 * Radar de competencias en pantalla.
 *
 * Pinta con clases de Tailwind para seguir el tema del usuario. La versión que
 * se descarga se arma aparte, en utils/radarShareImage.ts, porque esas clases
 * resuelven contra la hoja de estilos del documento y no sobreviven la
 * rasterización de un SVG suelto. La geometría que comparten las dos vive en
 * utils/radar.ts, así que no pueden dibujar polígonos distintos.
 */
export function CompetencyRadar({ scores, accentHex, className = "" }: CompetencyRadarProps) {
  const total = scores.length;
  if (total < 3) return null;

  const dataPoints = scores.map((s, i) =>
    radarPoint(i, total, (s.value / RADAR_MAX_VALUE) * MAX_RADIUS, CENTER)
  );
  const dataPolygon = radarPolygonPoints(total, MAX_RADIUS, CENTER, (i) => scores[i].value);

  // El viewBox se ensancha 44px por lado (centro sigue en 200) para que las
  // etiquetas laterales largas, como "IA aplicada", no se corten.
  return (
    <svg
      viewBox="-44 0 488 400"
      role="img"
      aria-label={`Gráfico de radar con tu puntaje en ${total} dominios`}
      className={`w-full max-w-lg mx-auto ${className}`}
    >
      {/* Anillos de referencia (1 a 5) */}
      {RADAR_RINGS.map((ring) => (
        <polygon
          key={ring}
          points={radarPolygonPoints(total, (ring / RADAR_MAX_VALUE) * MAX_RADIUS, CENTER)}
          fill="none"
          className="stroke-border"
          strokeWidth={ring === RADAR_RINGS.length ? 1.5 : 1}
        />
      ))}

      {/* Ejes hacia cada vértice */}
      {scores.map((s, i) => {
        const p = radarPoint(i, total, MAX_RADIUS, CENTER);
        return (
          <line
            key={s.key}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            className="stroke-border"
            strokeWidth={1}
          />
        );
      })}

      {/* Escala sobre el eje vertical */}
      {RADAR_RINGS.map((ring) => (
        <text
          key={ring}
          x={CENTER + 5}
          y={CENTER - (ring / RADAR_MAX_VALUE) * MAX_RADIUS + 4}
          className="fill-muted-foreground"
          opacity={0.6}
          fontSize={9}
        >
          {ring}
        </text>
      ))}

      {/* Polígono de puntajes */}
      <polygon
        points={dataPolygon}
        fill={accentHex}
        fillOpacity={0.16}
        stroke={accentHex}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <circle key={scores[i].key} cx={p.x} cy={p.y} r={3.5} fill={accentHex}>
          <title>{`${scores[i].label}: ${scores[i].value} / 5`}</title>
        </circle>
      ))}

      {/* Etiquetas de dominios */}
      {scores.map((s, i) => {
        const p = radarPoint(i, total, LABEL_RADIUS, CENTER);
        return (
          <text
            key={s.key}
            x={p.x}
            y={p.y + 3.5}
            textAnchor={radarTextAnchor(i, total)}
            className="fill-muted-foreground"
            fontSize={11}
          >
            {RADAR_SHORT_LABELS[s.key] ?? s.label}
          </text>
        );
      })}
    </svg>
  );
}
