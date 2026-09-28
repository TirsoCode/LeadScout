# LeadScout — Supabase

Guía de lo que hay **realmente** montado. Si algo de aquí no coincide con lo que
ves, manda el código (`lib/db.ts`, `lib/auth.ts`, `app/api/**`).

## Proyecto

| | |
|---|---|
| Ref | `lmxiakrjbeoqgwigmvmx` |
| Nombre | Leadscoutapp (org `eoducfhwlxirpafifhup`) |
| Región | West EU (Ireland) |
| Enlazado en | `supabase/.temp/project-ref` (lo escribe `supabase link`) |

## Puesta en marcha

```bash
supabase link --project-ref lmxiakrjbeoqgwigmvmx   # si no lo está
npm run supabase:setup                              # escribe .env.local (600)
supabase db push --linked                           # aplica el esquema
npm run dev                                         # o build + start
```

`npm run supabase:setup` es un script del repo (`scripts/setup-supabase.mjs`):
pide las claves a `supabase projects api-keys` y escribe **solo** `.env.local`,
que está en `.gitignore` y con permisos 600. No imprime las claves.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co`. Si faltan esta y la de abajo, la app arranca en **modo local** (cookie firmada + store en `.data/`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública. Va al navegador: es la que usa `@supabase/ssr` para la sesión y el OAuth. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor.** `lib/db.ts` la usa para leer/escribir `users`, `searches`, `leads` y `messages`. Sin ella la API responde pero no persiste. |

Las dos últimas se generan aquí, no se inventan: panel → Project Settings → API.

## Esquema

Fuente de verdad: `supabase/migrations/20260928000100_leadscout_app_schema.sql`.
`lib/db.ts` **no lleva DDL**: escribe contra estas columnas tal cual.

```
users      (id uuid = auth.uid(), email, created_at)
searches   (id text, user_id uuid?, url, business jsonb, live, created_at)
leads      (id text, search_id text, platform, name, title, username, url,
            community?, snippet, match_score, reason, origin, created_at)
messages   (id text, user_id uuid, lead_id, body, created_at, edited_at)
```

Detalles que importan:

- **Los ids de `searches`/`leads`/`messages` son `text`**, no `uuid`: los genera
  `randomId("search")` / `randomId("lead")` / `randomId("msg")` en el servidor.
- `searches.user_id` es `null` mientras la búsqueda es una **preview anónima**.
  Al registrarse, `claimPreviewForUser` la engancha al usuario nuevo (la
  búsqueda viaja en la cookie httpOnly `leadscout_preview`).
- En `leads` **solo se guardan leads completos**. El enmascarado de la preview
  se hace al serializar (`lib/mask.ts`), nunca en la tabla.
- La cuota de 3 mensajes/semana no es un trigger: la cuenta la app
  (`countMessagesThisWeek`, semana ISO en UTC).
- RLS está activado en las cuatro tablas, con políticas para `authenticated`
  basadas en `auth.uid()`. La app va con `service_role` (salta RLS); las
  políticas cierran la `anon` key por si algún día se usa desde el cliente.

> Hasta septiembre de 2026 el repo tenía dos migraciones (`…_setup_leadscout_schema`,
> `…_create_auth_functions`) con otro esquema —`business_profiles`, `leads.lead_score`,
> `messages.message_text`, ids `uuid`— que la aplicación no usa. Se sustituyeron
> por la de arriba. `supabase/seed.sql` quedó vacío a propósito por lo mismo.

## Configuración de Auth

Estado actual del proyecto:

| Ajuste | Valor | Por qué |
|---|---|---|
| `site_url` | `http://localhost:3000` | Base para los enlaces del correo y allow-list. |
| `uri_allow_list` | `http://localhost:3000/auth/callback` | Callback de OAuth (`app/auth/callback/route.ts`). Sin esto Google rebota. |
| `mailer_autoconfirm` | `true` | En dev, sin correo de confirmación el registro devuelve sesión al instante y `/api/auth/signup` funciona. **Desactívalo en producción.** |
| Google | sin configurar | Faltan credenciales de Google Cloud (ver abajo). |

Estos valores también están en `supabase/config.toml` (`[auth] site_url`,
`additional_redirect_urls`, `[auth.email] enable_confirmations = false`), así que
`supabase config push` los volvería a aplicar igual.

> **No lances `supabase config push` a ciegas.** `config.toml` es la plantilla de
> la CLI, así que Compared contra el proyecto real sale con diferencias
> (Twilio, TOTP, analytics de storage y el pooler están activados en la nube y
> apagados en la plantilla): un push las apagaría. `supabase config diff
> --project-ref <ref>` es de solo lectura y es la forma de ver qué cambia.

### Login con Google (pendiente)

El botón de la pantalla `/auth` siempre se muestra; sin credenciales de Google
pulsarlo explica que faltan las de Supabase. Para activarlo:

1. Google Cloud → APIs y servicios → Credenciales → **ID de cliente OAuth**,
   tipo *Web application*. Orígenes autorizados: `http://localhost:3000`.
   URI de redirección: `https://<ref>.supabase.co/auth/v1/callback`.
2. Panel de Supabase → Authentication → Providers → **Google**: pega
   `client_id` y `client_secret` y actívalo.
3. Ya está: `signInWithOAuth` (PKCE) → `/auth/callback` → dashboard.

## Sesión y cookies

- `@supabase/ssr` guarda la sesión en cookies `sb-<ref>-auth-token`.
- `middleware.ts` llama a `getClaims()` en cada petición: los Server Components
  no pueden escribir cookies, así que sin ese middleware el token caducaría a la
  hora y el usuario se caería del dashboard.
- `getCurrentUser()` (`lib/auth.ts`) es la única puerta de entrada al resto del
  código y nunca devuelve `passwordHash`.
- Los errores de Supabase se traducen al español en
  `app/api/auth/signup/route.ts` (`friendlyAuthError`), para que la UI no
  enseñe mensajes en inglés.

## Comprobaciones

```bash
curl -s localhost:3000/api/auth/session
# {"user":null,"mode":"supabase"}   -> las claves están cargadas
# {"user":null,"mode":"local"}      -> falta el .env.local: reinicia el servidor
```

`npm test` (33 checks) y `npm run test:ui` corren ya contra Supabase real en
este entorno: crean usuarios de prueba con emails `@leadscout.test` y los
mensajes que generan cuentan para la cuota de *su* usuario, no para el tuyo.
