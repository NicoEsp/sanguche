/**
 * Copiar texto al portapapeles sin depender de que la API moderna exista.
 *
 * `navigator.clipboard` necesita contexto seguro y permiso; el textarea oculto
 * cubre los casos donde no está disponible para que el botón nunca quede muerto.
 *
 * Vive acá y no dentro de un componente porque lo usan dos superficies del
 * mismo feature: el botón que copia el Markdown y la descarga del PNG, que deja
 * el texto de posteo listo para pegar.
 */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Cae al método viejo.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) throw new Error("execCommand copy devolvió false");
  } finally {
    document.body.removeChild(textarea);
  }
}
