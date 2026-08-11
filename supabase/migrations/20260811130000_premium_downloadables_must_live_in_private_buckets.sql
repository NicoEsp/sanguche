-- Un descargable premium nunca puede vivir en un bucket público.
--
-- Los buckets `resources`, `starterpack` y `course-thumbnails` son públicos, y
-- para esos el cliente resuelve la URL con getPublicUrl() en vez de pedir una
-- signed URL (ver PUBLIC_BUCKETS en useDownloadableResources.ts). Ahí Storage
-- nunca corre la policy que revalida access_level + has_active_premium():
-- conocer bucket_name y file_path alcanza para bajar el archivo.
--
-- Y esa metadata es pública desde 20260416131257: el rol anon lee bucket_name y
-- file_path de todo recurso activo. O sea que una fila premium en un bucket
-- público sería descargable por cualquiera, sin siquiera tener cuenta.
--
-- Hoy no hay ninguna — las 3 premium están en `downloads`, que es privado —
-- pero el camino existe: el admin de descargables conserva el bucket_name
-- original cuando editás una fila sin reemplazar el archivo, así que pasar a
-- premium una de las filas legacy del bucket `resources` bastaría para abrirla.
--
-- El arreglo no va en la visibilidad de la metadata. Recortarla reintroduciría
-- el bug de la card que desaparece (20260811120000) y encima ni siquiera
-- taparía el agujero: anon seguiría leyendo esas filas. Lo que hacemos es que
-- el estado peligroso no se pueda representar.

-- Fallamos fuerte si alguna fila ya está en ese estado: prefiero que la
-- migración se plante a declarar un invariante que no se cumple.
DO $$
DECLARE
  offending text;
BEGIN
  SELECT string_agg(format('%s (%s/%s)', d.slug, d.bucket_name, d.file_path), ', ')
  INTO offending
  FROM public.downloadable_resources d
  JOIN storage.buckets b ON b.id = d.bucket_name AND b.public
  WHERE d.access_level = 'premium';

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION
      'Hay descargables premium en buckets públicos: %. Movelos a un bucket privado antes de aplicar esta migración.',
      offending;
  END IF;
END $$;

-- Trigger en vez de CHECK: consultamos storage.buckets.public en lugar de una
-- lista hardcodeada, así un bucket público nuevo queda cubierto solo y no hay
-- nada que mantener sincronizado con PUBLIC_BUCKETS del cliente.
CREATE OR REPLACE FUNCTION public.enforce_premium_downloadable_bucket_is_private()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.access_level = 'premium' AND EXISTS (
    SELECT 1 FROM storage.buckets b
    WHERE b.id = NEW.bucket_name AND b.public
  ) THEN
    RAISE EXCEPTION
      'El bucket "%" es público: un descargable premium ahí se puede bajar sin suscripción. Subí el archivo a un bucket privado (downloads).',
      NEW.bucket_name
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_premium_downloadable_bucket_is_private
BEFORE INSERT OR UPDATE OF access_level, bucket_name
ON public.downloadable_resources
FOR EACH ROW
EXECUTE FUNCTION public.enforce_premium_downloadable_bucket_is_private();
