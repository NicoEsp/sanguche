/**
 * Los bloques de datos del prompt (<perfil>, <material_analizado>,
 * <transcripcion>...) se delimitan con etiquetas. Un texto que viene de la
 * persona o de material de terceros no puede abrir ni cerrar esas etiquetas:
 * si pudiera, lo que sigue quedaría fuera del bloque de datos y se leería como
 * instrucción.
 *
 * Se escapa el "<" en lugar de borrar la etiqueta: borrar en una pasada deja
 * que "</per</perfil>fil>" se rearme como "</perfil>".
 */
export function neutralizeTags(text: string, names: string[]): string {
  const pattern = new RegExp(`<(\\s*/?\\s*(?:${names.join("|")})\\b)`, "gi");
  return text.replace(pattern, "‹$1");
}
