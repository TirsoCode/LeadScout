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

Copia `.env.example` a `.env.local` para activar los servicios reales.

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
app/            rutas: landing, /dashboard, /api/*, /auth/callback
components/     landing/  dashboard/  auth/
lib/            scan, crawl, heuristics, openrouter, reddit, message,
                mask, auth, db, secret, types, utils, api
scripts/        e2e.sh, ui-flow.mjs, check-bg.mjs, shot.mjs, pixel.mjs
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
- Google login está implementado, pero el botón **solo se muestra si hay
  Supabase configurado**: sin claves no podría funcionar y preferimos no
  enseñar un botón muerto.
- `metadata` de `/dashboard` es `robots: noindex`. Las páginas son dinámicas
  (leen cookies), así que no hay `output: "export"`.

Si tocas el CSS y parece que no carga, **no lances `npm run build` con
`next dev` corriendo**: los dos escriben en `.next` y corrompen el dev server.
Para el build, para el dev server antes.
