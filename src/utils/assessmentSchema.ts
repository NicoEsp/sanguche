import { z } from "zod";
import { getDomainsForType, type AssessmentTypeKey } from "./scoring";

/**
 * Validación del formulario de /autoevaluacion.
 *
 * Vive aparte de scoring.ts a propósito: scoring lo importan la landing de la
 * evaluación, /soy-dev, /mejoras, /mentoria y /progreso, y con el schema
 * adentro todas esas rutas descargaban zod (52 kB) sin validar nada.
 */
const domainScoreSchema = () =>
  z.number({
    required_error: "Obligatorio para avanzar",
    invalid_type_error: "Debe seleccionar una opción válida"
  }).int().min(1, "Debe seleccionar al menos 1").max(5, "El valor máximo es 5");

const schemaCache: Partial<Record<AssessmentTypeKey, z.ZodObject<Record<string, z.ZodNumber>>>> = {};

export function getAssessmentSchema(type: AssessmentTypeKey) {
  const cached = schemaCache[type];
  if (cached) return cached;
  const shape: Record<string, z.ZodNumber> = {};
  for (const d of getDomainsForType(type)) {
    shape[d.key] = domainScoreSchema();
  }
  const schema = z.object(shape);
  schemaCache[type] = schema;
  return schema;
}
