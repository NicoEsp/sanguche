-- Los descargables premium desaparecían de /descargables en el momento en que
-- un usuario free iniciaba sesión.
--
-- Desde 20260416131257 ("Anon can view active downloadables metadata") un
-- visitante deslogueado lee la metadata de TODOS los recursos activos, mientras
-- que los autenticados seguían filtrados por access_level (20260409134259).
-- Las dos reglas discrepaban en la peor dirección posible: el visitante veía la
-- card premium, se registraba para conseguirla, y al volver logueado la fila ya
-- no llegaba del backend. Sin paywall, sin upsell, sin explicación: el recurso
-- simplemente no existía.
-- (Reportado el 2026-08-11 sobre "Product Vision", subido como premium el 08-10.)
--
-- Alineamos autenticados con anon: la metadata de todo recurso activo es
-- visible para cualquiera; el archivo sigue cerrado. Los bytes los protege la
-- policy de storage "Authenticated users can download files", que vuelve a
-- chequear access_level + has_active_premium() por su cuenta antes de que
-- Storage emita una signed URL. Abrir la metadata no le da a nadie una descarga
-- que antes no pudiera hacer.
--
-- La UI ya contemplaba este caso: DownloadableCard pinta un recurso premium que
-- el usuario no puede abrir como card bloqueada "Exclusivo Premium" con CTA a
-- /planes. Esa rama era código muerto en /descargables porque la fila nunca
-- llegaba.

DROP POLICY IF EXISTS "Authenticated users can view allowed downloadables"
  ON public.downloadable_resources;

CREATE POLICY "Authenticated users can view active downloadables metadata"
ON public.downloadable_resources
FOR SELECT
TO authenticated
USING (is_active = true);

-- Las filas inactivas siguen siendo solo para admins vía la policy permisiva
-- ya existente "Admins can manage all downloadables" (FOR ALL, USING is_admin()),
-- que se suma por OR a la de arriba.
