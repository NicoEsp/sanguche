-- Crear función para garantizar datos base de usuario (profile + subscription)
create or replace function public.ensure_user_defaults()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_email text := auth.jwt() ->> 'email';
  v_name text := auth.jwt() -> 'user_metadata' ->> 'name';
begin
  -- Asegurar que el perfil existe
  select id into v_profile_id 
  from profiles 
  where user_id = auth.uid();
  
  if v_profile_id is null then
    -- Crear perfil si no existe
    insert into profiles (user_id, name, email)
    values (auth.uid(), v_name, v_email)
    returning id into v_profile_id;
  else
    -- Actualizar email/name si faltan
    update profiles
    set 
      email = coalesce(email, v_email),
      name = coalesce(name, v_name)
    where id = v_profile_id;
  end if;

  -- Asegurar que existe una suscripción (mínimo free)
  if not exists (
    select 1 from user_subscriptions 
    where user_id = v_profile_id
  ) then
    insert into user_subscriptions (user_id, plan, status)
    values (v_profile_id, 'free', 'active');
  end if;
end;
$$;