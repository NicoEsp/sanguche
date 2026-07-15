-- Retomar una evaluación ahora borra la fila anterior de assessments, y el
-- FK con ON DELETE CASCADE se llevaba consigo el registro de emails de
-- descuento ya enviados (auditoría y deduplicación). Se pasa a SET NULL para
-- que el historial de envíos sobreviva a la re-evaluación.
ALTER TABLE public.discount_email_queue
  ALTER COLUMN assessment_id DROP NOT NULL;

ALTER TABLE public.discount_email_queue
  DROP CONSTRAINT discount_email_queue_assessment_id_fkey;

ALTER TABLE public.discount_email_queue
  ADD CONSTRAINT discount_email_queue_assessment_id_fkey
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE SET NULL;
