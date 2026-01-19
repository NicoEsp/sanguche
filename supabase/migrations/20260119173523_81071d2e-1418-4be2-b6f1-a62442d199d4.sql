-- Agregar columna is_comped para suscripciones bonificadas
ALTER TABLE public.user_subscriptions 
ADD COLUMN is_comped BOOLEAN NOT NULL DEFAULT false;

-- Agregar notas opcionales para referencia interna del admin
ALTER TABLE public.user_subscriptions 
ADD COLUMN admin_notes TEXT;