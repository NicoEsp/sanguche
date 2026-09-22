import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { copyText } from "@/utils/clipboard";
import { buildMemoMarkdown } from "@/lib/fetita/memoMarkdown";
import { VERDICT_META, type FetitaMemo } from "@/lib/fetita/types";
import { FetitaVerdictBadge } from "./FetitaVerdictBadge";

const EVIDENCE_LABEL: Record<string, string> = {
  directa: "Directa",
  indirecta: "Indirecta",
  supuesto: "Supuesto",
};

const EVIDENCE_CLASS: Record<string, string> = {
  directa: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  indirecta: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  supuesto: "bg-muted text-muted-foreground",
};

interface FetitaMemoPanelProps {
  memo: FetitaMemo | null;
  title: string;
  /** false en el admin: copiar un memo ajeno no es un evento de la persona. */
  trackCopy?: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

/** El memo de la decisión: lo que Fetita dejó por escrito con su veredicto. */
export function FetitaMemoPanel({ memo, title, trackCopy = true }: FetitaMemoPanelProps) {
  const [copied, setCopied] = useState(false);
  const { trackEvent } = useMixpanelTracking();

  if (!memo) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm font-medium">Todavía no hay memo</p>
        <p className="text-sm text-muted-foreground">
          Fetita lo escribe al terminar el recorrido, o cuando se lo pidas. Queda acá con el veredicto y los huecos que falta
          cerrar.
        </p>
      </div>
    );
  }

  const c = memo.content;

  const handleCopy = async () => {
    try {
      await copyText(buildMemoMarkdown(memo, title));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (trackCopy) trackEvent("fetita_memo_copied", { verdict: memo.verdict, version: memo.version });
    } catch {
      toast.error("No pudimos copiar el memo.");
    }
  };

  return (
    <div className="space-y-5 p-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <FetitaVerdictBadge verdict={memo.verdict} />
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
            {copied ? <Check className="mr-1.5 h-4 w-4 text-green-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <p className="text-sm text-foreground/90">{c.motivo_veredicto}</p>
        <p className="text-xs text-muted-foreground">
          Versión {memo.version} · {format(new Date(memo.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
          {c.cambios_vs_anterior ? ` · ${c.cambios_vs_anterior}` : ""}
        </p>
      </div>

      <Section title="Decisión">{c.decision}</Section>
      <Section title="Problema y segmento">{c.problema_y_segmento}</Section>

      <Section title="Evidencia">
        {c.evidencia.length === 0 ? (
          <p className="text-muted-foreground">Sin evidencia registrada.</p>
        ) : (
          <ul className="space-y-2.5">
            {c.evidencia.map((e, i) => (
              <li key={i} className="rounded-md border p-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={EVIDENCE_CLASS[e.tipo]}>
                    {EVIDENCE_LABEL[e.tipo] ?? e.tipo}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Peso {e.peso}</span>
                </div>
                <p className="mt-1.5">{e.afirmacion}</p>
                <p className="mt-1 text-xs text-muted-foreground">{e.procedencia}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {c.supuestos_abiertos.length > 0 && (
        <Section title="Supuestos abiertos">
          <ul className="list-disc space-y-1 pl-4">
            {c.supuestos_abiertos.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {c.sesgos.length > 0 && (
        <Section title="Sesgos detectados">
          <ul className="space-y-1.5">
            {c.sesgos.map((s, i) => (
              <li key={i}>
                <span className="font-medium">{s.sesgo}.</span> {s.por_que_importa}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Qué se deja de hacer">
        {c.que_se_deja_de_hacer.que}
        <span className="block text-xs text-muted-foreground">Lo aceptó: {c.que_se_deja_de_hacer.quien_lo_acepto}</span>
      </Section>
      <Section title="Qué la refutaría">{c.que_la_refutaria}</Section>
      <Section title="Test más chico">
        <p>{c.test_mas_chico.que}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Plazo: {c.test_mas_chico.plazo} · Resultado esperado: {c.test_mas_chico.resultado_esperado}
        </p>
      </Section>
      <Section title="Criterio de fin">{c.criterio_de_fin}</Section>

      {c.huecos.length > 0 && (
        <Section title="Huecos por cerrar">
          <ol className="list-decimal space-y-1.5 pl-4">
            {c.huecos.map((h, i) => (
              <li key={i}>
                <span className="font-medium">{h.hueco}.</span> {h.como_cerrarlo}
              </li>
            ))}
          </ol>
        </Section>
      )}

      <p className="text-xs text-muted-foreground">{VERDICT_META[memo.verdict]?.description}</p>
    </div>
  );
}
