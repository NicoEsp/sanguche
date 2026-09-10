-- Al asignar un plan pago a mano, desvincular la fila de LemonSqueezy.
--
-- La versión anterior conservaba lemon_squeezy_subscription_id (y customer,
-- order y variant) de una suscripción vieja del usuario. El webhook busca las
-- filas por ese id, así que un subscription_expired o subscription_cancelled
-- posterior matcheaba la fila y le pisaba el status al plan manual: un B2B
-- pagado por transferencia perdía el acceso cuando vencía el Premium viejo.
--
-- Dos reglas nuevas, sólo para planes distintos de free:
-- 1. Si el usuario tiene una suscripción de LemonSqueezy activa, se rechaza:
--    hay que cancelarla en LemonSqueezy primero. Si no, LemonSqueezy le sigue
--    cobrando y, sin el id en la fila, ni el usuario desde el perfil ni el
--    admin pueden cancelarla desde la app.
-- 2. Se limpian los ids de LemonSqueezy y las fechas de período: la fila pasa
--    a ser manual y ningún evento del proveedor la vuelve a tocar.
-- Pasar a Free no cambia: conserva los ids, como hasta ahora.

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
  v_current record;
  v_purchase_type text;
  v_detach boolean;
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

  SELECT plan, status, lemon_squeezy_subscription_id
  INTO v_current
  FROM public.user_subscriptions
  WHERE user_id = p_target_profile_id;

  v_detach := p_new_plan <> 'free';

  -- Una suscripción viva en LemonSqueezy se cancela allá antes de pisarla a
  -- mano. Una fila free con un id viejo (ya cancelada o vencida) no cuenta.
  IF v_detach
     AND v_current.lemon_squeezy_subscription_id IS NOT NULL
     AND v_current.status = 'active'
     AND v_current.plan IN ('premium', 'repremium') THEN
    RAISE EXCEPTION 'El usuario tiene una suscripción activa en LemonSqueezy (ID %). Cancelala en LemonSqueezy antes de asignarle un plan a mano.',
      v_current.lemon_squeezy_subscription_id;
  END IF;

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
    -- Plan pago manual: sin vínculo con LemonSqueezy ni fechas de un período
    -- que ya no existe. En el admin queda como "Manual".
    lemon_squeezy_subscription_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_subscription_id END,
    lemon_squeezy_customer_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_customer_id END,
    lemon_squeezy_order_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_order_id END,
    lemon_squeezy_variant_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_variant_id END,
    current_period_end = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.current_period_end END,
    trial_end = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.trial_end END,
    updated_at = now();

  -- Log admin action (admin_profile_id is obtained automatically)
  PERFORM public.log_admin_action(
    p_target_profile_id,
    'plan_upgrade',
    jsonb_build_object(
      'old_plan', v_current.plan,
      'new_plan', p_new_plan,
      'notes', p_notes,
      'paid_amount', p_paid_amount,
      'is_comped', p_is_comped,
      'purchase_type', v_purchase_type,
      'detached_lemon_squeezy_subscription_id',
        CASE WHEN v_detach THEN v_current.lemon_squeezy_subscription_id ELSE NULL END
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_plan', v_current.plan,
    'new_plan', p_new_plan
  );
END;
$function$;
