/**
 * La misma regex que aplica `z.string().email()` en zod v3.
 *
 * Los formularios de checkout validaban el email con zod, y eso sumaba los
 * 52 kB de zod a /planes, /cursos-info, /empresas y /perfil solo para esta
 * línea. Con la regex copiada el criterio no cambia.
 */
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value);
