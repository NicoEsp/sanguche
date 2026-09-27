/**
 * Las sesiones se publican en hora de Argentina (UTC-3, sin horario de
 * verano). session_date es timestamptz: el valor de un input datetime-local
 * ("2026-10-01T19:00") no trae offset y la base lo guardaba como UTC, así que
 * una sesión cargada a las 19 se mostraba a las 16. Y la página pública la
 * mostraba en la hora local de quien mira, rotulada "(Argentina)".
 */
const AR_TIME_ZONE = "America/Argentina/Buenos_Aires";
const AR_OFFSET = "-03:00";

const wallTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: AR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Valor de un input datetime-local, tomado como hora argentina → ISO con offset. */
export const fromArgentinaInput = (value: string) => `${value}:00${AR_OFFSET}`;

/** Instante guardado → valor para un input datetime-local en hora argentina. */
export const toArgentinaInput = (iso: string) => {
  const parts = Object.fromEntries(
    wallTimeFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

/**
 * Date cuyos campos locales son la hora argentina del instante, para
 * formatearla con date-fns igual desde cualquier huso horario.
 */
export const argentinaWallTime = (iso: string) => {
  const [date, time] = toArgentinaInput(iso).split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
};
