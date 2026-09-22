# Fetita: puesta en marcha y operación

Fetita es el agente de ProductPrepa: conversa con una persona de producto sobre
**una decisión por conversación**, la desafía siguiendo un protocolo de 7 pasos
y deja un memo con veredicto (listo, falta o frenar). Está en beta cerrada: sólo
la ven quienes habilitás desde `/admin/fetita`.

Todo el código ya está en el repo. Estos pasos la ponen en producción, en este
orden: base, secretos, funciones y recién después el frontend.

## 1. Aplicar la migración

```bash
supabase db push
```

`supabase/migrations/20260922120000_create_fetita.sql` crea las tablas
`fetita_*`, sus políticas de RLS y los RPC del admin. Si la aplicás con el MCP de
Supabase en vez de `db push`, queda registrada con otra versión: renombrá el
archivo a esa versión en un commit aparte ("Alinear la versión de la migración
con la aplicada en Supabase"), como con las anteriores.

Para verificar, en el SQL Editor:

```sql
select * from fetita_settings;
-- una fila: enabled = true, monthly_budget_usd = 30, default_monthly_messages = 60
```

Después conviene regenerar los tipos (`supabase gen types`) y compararlos con
`src/integrations/supabase/types.ts`, donde las entradas de Fetita se
escribieron a mano.

## 2. Cargar los secretos

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

La key sale de **console.anthropic.com → API Keys**. La API se paga con créditos
prepagos: cargá lo que quieras gastar y poné un límite mensual en **Settings →
Limits** de la consola, además del presupuesto de Fetita (paso 5).

Opcionales, con su valor por defecto:

| Variable | Default | Para qué |
| --- | --- | --- |
| `FETITA_MODEL` | `claude-opus-5` | El modelo que conversa |
| `FETITA_AUX_MODEL` | `claude-sonnet-5` | Lee el material pegado y hace de juez de alucinaciones |
| `FETITA_EFFORT` | `medium` | Esfuerzo de razonamiento del chat: `low`, `medium`, `high`, `xhigh` o `max`. Con más esfuerzo sube el tope de tokens por ronda y el costo |
| `FETITA_TURN_TIMEOUT_MS` | `140000` | Tope de un turno. Subilo sólo en el plan pago de Supabase (400 s) |
| `FETITA_WALL_CLOCK_MS` | `150000` | Tiempo total de la función según el plan (400000 en el pago). El juez corre en lo que sobra del turno |

Si cambiás a un modelo que no está en `supabase/functions/_shared/fetita/pricing.ts`,
agregalo ahí: si no, el tablero lo cobra como Opus 5 y lo marca como "sin precio".

## 3. Desplegar las funciones

```bash
supabase functions deploy fetita-chat
supabase functions deploy fetita-evaluate
```

La CLI lee `verify_jwt = true` de `supabase/config.toml` y empaqueta
`_shared/fetita/`. Si desplegás con el MCP, subí también los archivos de
`_shared/fetita/` con su ruta relativa y marcá `verify_jwt` en true.

## 4. Mergear el frontend

Vercel despliega `main` solo. `/fetita` queda con `noindex` y bloqueada en
`robots.txt`.

## 5. Configurar y habilitar

En **`/admin/fetita` → Resumen** está la configuración general:

- **Fetita activa**: el interruptor general. Apagado, frena a todos menos a los admins.
- **Presupuesto mensual (USD)**: cuando el gasto del mes lo alcanza, Fetita se frena para todos, admins incluidos.
- **Mensajes por mes por defecto**: el cupo de cada persona si no le pusiste uno propio. Cuenta turnos respondidos: si la API falla o Fetita declina, no se descuenta.

Cada persona tiene un turno a la vez: mientras Fetita responde, no puede mandar
otro mensaje en ninguna conversación ni borrar esa conversación.

En **Accesos** habilitás a cada persona por email. Tiene que haberse registrado
antes en `/auth`. Cada cambio queda en `admin_actions_log`.

## 6. Probar

1. Como admin (siempre habilitado): abrí `/fetita`, mandá una decisión y seguí hasta el memo.
2. En **`/admin/fetita` → Resumen** tiene que aparecer el costo del turno, y en **Calidad** el memo con el resultado del juez. Si el juez quedó en error por falta de tiempo, volvé a correrlo desde el memo.
3. Con una cuenta que no sea admin: sin acceso tiene que ver "beta cerrada"; habilitala y probá de nuevo.
4. Compará el gasto de `fetita_runs` con el de la consola de Anthropic.

## Cómo se mide la calidad

- **Juez automático.** Cada memo que se guarda lo revisa `FETITA_AUX_MODEL`: lista las afirmaciones de hecho y marca las que la conversación no respalda. La tasa de alucinación es afirmaciones no soportadas sobre afirmaciones evaluadas. También es un modelo, así que se puede equivocar.
- **Tu revisión.** En **Calidad** marcás cada memo como correcto, alucinación o desafío flojo.
- **Feedback de la persona.** Pulgar arriba o abajo en cada respuesta, con motivo. "Inventó algo" es la señal de alucinación.

Los tres números se muestran por separado y nunca se mezclan.

## Privacidad

- El material que la persona pega se lee en una llamada aparte y **no se guarda**: a la conversación sólo entra la lectura, con citas cortas.
- Las conversaciones sí se guardan y el admin las puede leer. La pantalla vacía de `/fetita` lo avisa.
- La autoevaluación entra como dato en el primer mensaje de cada conversación, no como instrucción.
- El razonamiento interno del modelo (`api_messages`) sólo lo lee la función; ni la persona ni el admin lo ven desde el navegador.
- La nota interna de cada acceso la ve sólo el admin.
- Borrar una conversación borra sus mensajes, memos, checks y feedback. El costo queda en `fetita_runs` sin el vínculo.

## Apagar o volver atrás

- Pausar a todos: apagá **Fetita activa**. Las personas ven "Fetita está en pausa" y conservan su historial.
- Sacarle el acceso a alguien: **Accesos → Deshabilitar**.
- Tope duro de gasto: bajá el presupuesto mensual; se aplica en el turno siguiente.

> Un turno tarda entre 5 y 60 segundos según cuánto piense el modelo. Si la persona
> cierra la pestaña, la respuesta se guarda igual y aparece al volver.
