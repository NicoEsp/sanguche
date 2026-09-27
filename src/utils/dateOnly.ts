/**
 * due_date de los objetivos guarda un día de calendario como medianoche UTC
 * ("2026-09-30T00:00:00+00:00"). new Date() lo toma como ese instante, que en
 * Argentina es el día anterior a las 21: la fecha se veía un día antes. Acá se
 * toma solo el día y se arma en hora local.
 */
export const parseDateOnly = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Inversa de parseDateOnly: el día elegido en el calendario, sin hora.
 * toISOString() lo pasaba a UTC y con husos positivos guardaba el día anterior.
 */
export const toDateOnly = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
