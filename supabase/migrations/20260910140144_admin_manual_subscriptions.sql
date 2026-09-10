-- Registrar un plan pagado por fuera de LemonSqueezy (B2B por transferencia,
-- factura directa, etc.) desde el panel de admin.
--
-- La tabla ya soportaba estas filas: sin ids de LemonSqueezy el admin las
-- muestra como "Manual" y el webhook nunca las toca. Lo que faltaba era una
-- forma de dejarlas completas: admin_update_subscription sólo cambiaba plan y
-- estado, así que monto cobrado, tipo de compra y notas había que cargarlos
-- por SQL a mano.
--
-- Los parámetros nuevos son opcionales y NULL significa "no tocar", así los
-- llamadores existentes (upgrade a Premium, pasar a Free) siguen funcionando
-- igual. Se dropea la firma vieja: si convivieran las dos, una llamada con
-- tres argumentos sería ambigua para Postgres.

DROP FUNCTION IF EXISTS public.admin_update_subscription(uuid, subscription_plan, text);

CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  p_target_profile_id uuid,
  p_new_plan subscription_plan,
  p_notes text DEFAULT NULL,
  p_paid_amount integer DEFAULT NULL,
  p_is_comped boolean DEFAULT NULL,
  p_purchase_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_plan subscription_plan;
  v_purchase_type text;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  IF p_paid_amount IS NOT NULL AND p_paid_amount < 0 THEN
    RAISE EXCEPTION 'Invalid paid amount: must be zero or positive';
  END IF;

  IF p_purchase_type IS NOT NULL AND p_purchase_type NOT IN ('subscription', 'one_time') THEN
    RAISE EXCEPTION 'Invalid purchase type: only subscription or one_time are allowed';
  END IF;

  -- Mismo criterio que el webhook: premium/repremium son suscripciones y el
  -- resto pago único. Al pasar a Free no se toca.
  v_purchase_type := COALESCE(
    p_purchase_type,
    CASE
      WHEN p_new_plan IN ('premium', 'repremium') THEN 'subscription'
      WHEN p_new_plan = 'free' THEN NULL
      ELSE 'one_time'
    END
  );

  SELECT plan INTO v_old_plan
  FROM public.user_subscriptions
  WHERE user_id = p_target_profile_id;

  -- handle_new_user() crea la fila free en el alta, pero por las dudas se
  -- contempla un perfil sin fila: se inserta en vez de fallar en silencio.
  INSERT INTO public.user_subscriptions (
    user_id, plan, status, purchase_type, paid_amount, is_comped, admin_notes
  )
  VALUES (
    p_target_profile_id,
    p_new_plan,
    'active',
    v_purchase_type,
    p_paid_amount,
    COALESCE(p_is_comped, false),
    p_notes
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    status = 'active',
    purchase_type = COALESCE(EXCLUDED.purchase_type, user_subscriptions.purchase_type),
    -- paid_amount se conserva al pasar a Free: el LTV del dashboard suma el
    -- histórico de todas las filas, no sólo las activas.
    paid_amount = COALESCE(EXCLUDED.paid_amount, user_subscriptions.paid_amount),
    is_comped = COALESCE(p_is_comped, user_subscriptions.is_comped),
    admin_notes = COALESCE(EXCLUDED.admin_notes, user_subscriptions.admin_notes),
    updated_at = now();

  -- Log admin action (admin_profile_id is obtained automatically)
  PERFORM public.log_admin_action(
    p_target_profile_id,
    'plan_upgrade',
    jsonb_build_object(
      'old_plan', v_old_plan,
      'new_plan', p_new_plan,
      'notes', p_notes,
      'paid_amount', p_paid_amount,
      'is_comped', p_is_comped,
      'purchase_type', v_purchase_type
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_plan', v_old_plan,
    'new_plan', p_new_plan
  );
END;
$function$;

COMMENT ON FUNCTION public.admin_update_subscription(uuid, subscription_plan, text, integer, boolean, text) IS
  'Asigna un plan desde el admin. p_paid_amount va en centavos de ARS, igual que lo que escribe el webhook de LemonSqueezy. NULL en los parámetros opcionales deja el valor que ya tenía la fila.';

GRANT EXECUTE ON FUNCTION public.admin_update_subscription(uuid, subscription_plan, text, integer, boolean, text) TO authenticated;
