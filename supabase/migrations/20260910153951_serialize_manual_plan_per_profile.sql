-- Serializar admin_update_subscription por perfil, incluido el caso sin fila.
--
-- Review de CodeRabbit: el FOR UPDATE de la migración anterior bloquea la
-- fila cuando existe, pero cuando no existe no bloquea nada, y dos llamadas
-- concurrentes sobre el mismo perfil podían validar las dos contra "sin fila"
-- y pisarse en el upsert (por ejemplo, una guarda un monto y la otra marca
-- bonificado conservando ese monto). Un advisory lock transaccional por
-- perfil serializa lectura, validación y upsert de punta a punta. Se libera
-- solo al terminar la transacción.

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
  v_ls_live boolean;
  v_detach boolean;
  v_effective_comped boolean;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  -- Una llamada por perfil a la vez, haya fila o no. La clave lleva el nombre
  -- de la función para no chocar con otros advisory locks del proyecto.
  PERFORM pg_advisory_xact_lock(hashtext('admin_update_subscription'), hashtext(p_target_profile_id::text));

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

  -- Bloquea la fila hasta el commit: un evento del webhook sobre el mismo
  -- usuario espera a que esta decisión termine.
  SELECT plan, status, is_comped, lemon_squeezy_subscription_id
  INTO v_current
  FROM public.user_subscriptions
  WHERE user_id = p_target_profile_id
  FOR UPDATE;

  -- Bonificado efectivo: lo que llega, o lo que ya tenía la fila.
  v_effective_comped := COALESCE(p_is_comped, v_current.is_comped, false);

  IF v_effective_comped AND p_paid_amount IS NOT NULL AND p_paid_amount > 0 THEN
    RAISE EXCEPTION 'Un plan bonificado no lleva monto cobrado. Si ahora paga, desmarcá bonificado.';
  END IF;

  -- Vínculo vigente: hay id de suscripción y LemonSqueezy todavía puede cobrar.
  v_ls_live := v_current.lemon_squeezy_subscription_id IS NOT NULL
               AND v_current.status <> 'cancelled';

  IF p_new_plan <> 'free' AND v_ls_live THEN
    RAISE EXCEPTION 'El usuario tiene una suscripción vigente en LemonSqueezy (ID %, estado %). Cancelala en LemonSqueezy antes de asignarle un plan a mano.',
      v_current.lemon_squeezy_subscription_id, v_current.status;
  END IF;

  -- Plan pago manual: siempre se desvincula (la guarda ya garantizó que no hay
  -- nada vigente). Free: se desvincula sólo si el vínculo está muerto; uno
  -- vigente se conserva para que el webhook lo siga reflejando.
  v_detach := p_new_plan <> 'free' OR NOT v_ls_live;

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
    -- paid_amount se conserva al pasar a Free y al bonificar: el LTV del
    -- dashboard suma el histórico de todas las filas, no sólo las activas.
    paid_amount = COALESCE(EXCLUDED.paid_amount, user_subscriptions.paid_amount),
    is_comped = COALESCE(p_is_comped, user_subscriptions.is_comped),
    admin_notes = COALESCE(EXCLUDED.admin_notes, user_subscriptions.admin_notes),
    -- Sin vínculo con LemonSqueezy ni fechas de un período que ya no existe.
    -- En el admin queda como "Manual".
    lemon_squeezy_subscription_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_subscription_id END,
    lemon_squeezy_customer_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_customer_id END,
    lemon_squeezy_order_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_order_id END,
    lemon_squeezy_variant_id = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.lemon_squeezy_variant_id END,
    current_period_end = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.current_period_end END,
    trial_end = CASE WHEN v_detach THEN NULL ELSE user_subscriptions.trial_end END,
    updated_at = now()
  -- Recheck atómico: si entre el SELECT (que no bloquea nada cuando no había
  -- fila) y este upsert el webhook insertó una suscripción vigente, no se pisa.
  WHERE NOT (
    v_detach
    AND user_subscriptions.lemon_squeezy_subscription_id IS NOT NULL
    AND user_subscriptions.status <> 'cancelled'
  );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La suscripción del usuario cambió mientras se asignaba el plan (llegó un evento de LemonSqueezy). Volvé a intentar.';
  END IF;

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
