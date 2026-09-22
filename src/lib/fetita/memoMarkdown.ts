import { VERDICT_META, type FetitaMemo } from "./types";

/**
 * El memo de Fetita como Markdown, para llevarlo a un doc, a Notion o a un
 * mensaje al líder. Sigue el mismo orden que el panel.
 */

const EVIDENCE_TYPE: Record<string, string> = {
  directa: "Evidencia directa",
  indirecta: "Evidencia indirecta",
  supuesto: "Supuesto",
};

function cell(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
}

export function buildMemoMarkdown(memo: FetitaMemo, title: string): string {
  const c = memo.content;
  const lines: string[] = [];
  const push = (...text: string[]) => lines.push(...text);

  push(`# Memo de decisión: ${title}`, "");
  push(`**Veredicto:** ${VERDICT_META[c.veredicto]?.label ?? c.veredicto}. ${c.motivo_veredicto}`, "");
  push(`## Decisión`, "", c.decision, "");
  push(`## Problema y segmento`, "", c.problema_y_segmento, "");

  push(`## Evidencia`, "");
  if (c.evidencia.length === 0) {
    push("Sin evidencia registrada.", "");
  } else {
    push("| Afirmación | Tipo | Procedencia | Peso |", "| --- | --- | --- | --- |");
    for (const e of c.evidencia) {
      push(`| ${cell(e.afirmacion)} | ${EVIDENCE_TYPE[e.tipo] ?? e.tipo} | ${cell(e.procedencia)} | ${e.peso} |`);
    }
    push("");
  }

  if (c.supuestos_abiertos.length > 0) {
    push(`## Supuestos abiertos`, "", ...c.supuestos_abiertos.map((s) => `- ${s}`), "");
  }
  if (c.sesgos.length > 0) {
    push(`## Sesgos detectados`, "", ...c.sesgos.map((s) => `- **${s.sesgo}.** ${s.por_que_importa}`), "");
  }

  push(`## Qué se deja de hacer`, "", `${c.que_se_deja_de_hacer.que} (lo aceptó: ${c.que_se_deja_de_hacer.quien_lo_acepto})`, "");
  push(`## Qué la refutaría`, "", c.que_la_refutaria, "");
  push(
    `## Test más chico`,
    "",
    `- **Qué:** ${c.test_mas_chico.que}`,
    `- **Plazo:** ${c.test_mas_chico.plazo}`,
    `- **Resultado esperado:** ${c.test_mas_chico.resultado_esperado}`,
    "",
  );
  push(`## Criterio de fin del discovery`, "", c.criterio_de_fin, "");

  if (c.huecos.length > 0) {
    push(`## Huecos, en orden de importancia`, "", ...c.huecos.map((h, i) => `${i + 1}. **${h.hueco}.** ${h.como_cerrarlo}`), "");
  }

  push("---", "", `Memo v${memo.version} generado por Fetita, el agente de ProductPrepa.`);
  return lines.join("\n");
}
