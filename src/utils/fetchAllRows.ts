const PAGE_SIZE = 1000;

/**
 * Lee una consulta completa de a páginas. PostgREST corta en 1000 filas sin
 * avisar (max_rows), y un .limit() más alto no lo cambia: sin paginar, las
 * pantallas del admin mostraban datos truncados cuando la tabla crecía.
 *
 * La consulta tiene que tener un orden determinístico (idealmente por una
 * columna única): sin eso, .range() puede saltear o repetir filas entre páginas.
 */
export async function fetchAllRows<T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await makeQuery(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}
