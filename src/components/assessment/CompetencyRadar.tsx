import { AnyDomainKey, DomainScore } from "@/utils/scoring";

interface CompetencyRadarProps {
  scores: DomainScore[];
  accentHex: string;
  className?: string;
}

// Etiquetas cortas para los vértices: los labels completos no entran
// alrededor del polígono.
const SHORT_LABELS: Record<AnyDomainKey, string> = {
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

const CENTER = 200;
const MAX_RADIUS = 132;
const LABEL_RADIUS = MAX_RADIUS + 22;
const MAX_VALUE = 5;

function pointAt(index: number, total: number, radius: number): { x: number; y: number } {
  // Arranca arriba (-90°) y avanza en sentido horario.
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle)
  };
}

function textAnchorAt(index: number, total: number): "start" | "middle" | "end" {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const cos = Math.cos(angle);
  if (cos > 0.25) return "start";
  if (cos < -0.25) return "end";
  return "middle";
}

export function CompetencyRadar({ scores, accentHex, className = "" }: CompetencyRadarProps) {
  const total = scores.length;
  if (total < 3) return null;

  const rings = [1, 2, 3, 4, 5];
  const dataPoints = scores.map((s, i) => pointAt(i, total, (s.value / MAX_VALUE) * MAX_RADIUS));
  const dataPolygon = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg
      // El viewBox se ensancha 44px por lado (centro sigue en 200) para que
      // las etiquetas laterales largas, como "IA aplicada", no se corten.
      viewBox="-44 0 488 400"
      role="img"
      aria-label={`Gráfico de radar con tu puntaje en ${total} dominios`}
      className={`w-full max-w-lg mx-auto ${className}`}
    >
      {/* Anillos de referencia (1 a 5) */}
      {rings.map((ring) => {
        const radius = (ring / MAX_VALUE) * MAX_RADIUS;
        const points = scores
          .map((_, i) => {
            const p = pointAt(i, total, radius);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(" ");
        return (
          <polygon
            key={ring}
            points={points}
            fill="none"
            className="stroke-border"
            strokeWidth={ring === rings.length ? 1.5 : 1}
          />
        );
      })}

      {/* Ejes hacia cada vértice */}
      {scores.map((s, i) => {
        const p = pointAt(i, total, MAX_RADIUS);
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
      {rings.map((ring) => (
        <text
          key={ring}
          x={CENTER + 5}
          y={CENTER - (ring / MAX_VALUE) * MAX_RADIUS + 4}
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
        const p = pointAt(i, total, LABEL_RADIUS);
        return (
          <text
            key={s.key}
            x={p.x}
            y={p.y + 3.5}
            textAnchor={textAnchorAt(i, total)}
            className="fill-muted-foreground"
            fontSize={11}
          >
            {SHORT_LABELS[s.key] ?? s.label}
          </text>
        );
      })}
    </svg>
  );
}
