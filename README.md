# LeadScout

Pones la URL de tu negocio. LeadScout lee tu web, entiende a qué te dedicas y
busca en Reddit gente que está buscando **justo eso** ahora mismo. Te da una
lista de leads con un mensaje escrito para cada uno.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Arranca sin configurar nada

No hace falta `.env.local`. La app funciona entera con fallbacks locales y, en
cuanto defines una clave, cambia al servicio real sin tocar código:

| Sin esta variable | Qué hace en su lugar |
|---|---|
| `OPENROUTER_API_KEY` | Analizador heurístico propio (`lib/heuristics.ts`): taxonomía de 14 servicios ES/EN, señales de intención de compra y restadores (noticias, memes, "ya lo tengo"). |
| `NEXT_PUBLIC_SUPABASE_*` | Auth con cookie firmada + scrypt, y base de datos en `.data/leadscout.json`. |
| — (Reddit siempre) | Si la API pública de Reddit responde, trae los leads reales. Si devuelve 403 (típico en IPs de datacenter) genera un dataset de demostración, marcado con `live: false` y el badge "Dataset de demostración". |

Copia `.env.example` a `.env.local` para activar los servicios reales. Si vas a
usar Supabase, mejor `npm run supabase:setup`: pide las claves a la CLI del
proyecto enlazado y escribe `.env.local` con permisos 600 (la `service_role` no
debe salir nunca de un archivo del repo).

## Supabase (ya montado en este entorno)

Proyecto `lmxiakrjbeoqgwigmvmx` (Leadscoutapp, West EU), con el esquema aplicado
y auth funcionando: email + contraseña contra Supabase Auth, y la cookie de
sesión renovada por `middleware.ts`.

```bash
npm run supabase:setup          # escribe .env.local con las claves (mode 600)
supabase db push --linked       # aplica supabase/migrations/ a la nube
```

Dos cosas que conviene tener presentes:

- El proyecto tiene **`mailer_autoconfirm: true`**: en desarrollo el registro
  devuelve sesión al instante, sin correo de confirmación. Desactívalo en producción.
- El botón de Google sigue sin credenciales de Google Cloud. El callback ya está
  permitido (`http://localhost:3000/auth/callback`); los pasos exactos para
  activarlo están en `SUPABASE_SETUP_GUIDE.md`.

## Cómo funciona

1. **`POST /api/scan`** valida la URL, la descarga (`lib/crawl.ts`, bloqueando
   IPs privadas por SSRF) y extrae el perfil del negocio.
2. Se generan las búsquedas y se llama a Reddit (`lib/reddit.ts`).
3. Cada post se puntúa por intención de compra y se filtra el ruido.
4. **Sin sesión** los leads se recortan en el servidor (`lib/mask.ts`): no se
   envía `url`, `username`, `snippet` ni `reason`. Solo se ven en el pixelado.
5. **Con sesión** llegan completos, con su mensaje generado (`lib/message.ts`).

## Estructura

```
app/            rutas: landing, /auth, /dashboard, /api/*, /auth/callback
components/     landing/  dashboard/  auth/
lib/            scan, crawl, heuristics, openrouter, reddit, message,
                mask, auth, db, secret, types, utils, api
middleware.ts   refresca la sesión de Supabase (cookies)
supabase/       config.toml + migrations/ (el esquema que usa lib/db.ts)
scripts/        e2e.sh, ui-flow.mjs, check-bg.mjs, shot.mjs, pixel.mjs,
                setup-supabase.mjs
```

`lib/db.ts` tiene dos backends (Supabase o JSON local) y `lib/auth.ts` dos
proveedores de sesión; ambos se eligen por la presencia de las variables de
entorno. Ver `AGENTS.md` para el detalle de la arquitectura y los gotchas.

## Tests

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm test            # 33 checks end-to-end por HTTP (API, cookies, cuota)
npm run test:ui     # Chromium headless: clic y escritura reales
npm run test:bg     # background-color computado por el navegador
```

`npm test` cubre lo que importa de verdad:

- La preview anónima nunca filtra PII de los leads.
- El 4º mensaje de la semana se rechaza; editar (`PATCH`) no gasta cuota.
- Un lead de otro usuario devuelve 404.
- `/dashboard` redirige si no hay sesión.

## Notas

- **Gratis ahora, sin plan de pago.** 3 mensajes por semana (semana ISO, UTC).
- Google login está implementado y el botón se muestra siempre. Sin claves de
  Supabase, al pulsarlo la pantalla `/auth` explica que faltan
  `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en vez de
  fallar en silencio.
- **Registro e inicio de sesión son una pantalla aparte** (`/auth`): panel de
  marca a la izquierda y formulario a la derecha, no un modal sobre la landing.
- `metadata` de `/dashboard` es `robots: noindex`. Las páginas son dinámicas
  (leen cookies), así que no hay `output: "export"`.

Si tocas el CSS y parece que no carga, **no lances `npm run build` con
`next dev` corriendo**: los dos escriben en `.next` y corrompen el dev server.
Para el build, para el dev server antes.

Y si cambias colores en `tailwind.config.ts`, ten en cuenta que eso **no
invalida** el CSS cacheado: para el dev server, `rm -rf .next`, y arranca. Si no,
el navegador sigue recibiendo las utilities con los valores antiguos.
