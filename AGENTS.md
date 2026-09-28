# LeadScout — AGENTS.md

Micro-SaaS que encuentra clientes potenciales a partir de la web de un negocio (Next.js 14 App Router, TypeScript strict, Tailwind, servidor). Toda la UI está en español: mantén ese idioma en textos nuevos.

## Comandos

- `npm run dev` — dev server en **localhost:3000**
- `npm run typecheck` — `tsc --noEmit` (verificación rápida principal)
- `npm run lint` — `next lint`
- `npm test` — `scripts/e2e.sh`: 33 checks contra el server por HTTP (API real, cookies y cookies de sesión)
- `npm run test:ui` — `scripts/ui-flow.mjs`: Chromium headless, hace clic y escribe de verdad (modal, validación, registro, dashboard)
- `npm run test:bg` — `scripts/check-bg.mjs`: lee el `background-color` **computado** por el navegador
- `npm run shot -- <url> <salida.png>` — captura de pantalla headless
- `npm run pixel -- <png> [x] [y]` — decodifica el PNG y dice el color real del píxel (sin dependencias)
- `npm run build` — build de producción

**Verificación completa = typecheck + lint + `npm test` + `npm run test:ui`.**

## Arquitectura

### Backend (route handlers, todos `force-dynamic` + `runtime: "nodejs"`)

- `app/api/scan/route.ts` — `POST { url }`. Devuelve leads **enmascarados** si no hay sesión, completos si la hay. Siempre guarda el search y pone el `searchId` en la cookie httpOnly `leadscout_preview`.
- `app/api/auth/signup/route.ts` — `mode: "signup" | "login"`. Email/password por Supabase o por store local.
- `app/api/auth/logout/route.ts`, `app/api/auth/session/route.ts` (devuelve usuario + cuota).
- `app/api/messages/route.ts` — `POST` genera (gasta cuota), `PATCH` edita (no gasta), `GET` lista.
- `app/auth/callback/route.ts` — callback de OAuth (Google) vía PKCE.

### `lib/`

- `types.ts` — modelo (`BusinessProfile`, `Lead`, `Message`) y constantes (`FREE_WEEKLY_MESSAGE_LIMIT = 3`).
- `utils.ts` — `validateUrlInput` (devuelve `{ok,url}` o `{ok:false,error}` con mensaje en español), `truncate`, `initials`, `currentIsoWeek`, `randomId`, `slug`.
- `crawl.ts` — fetch de la web del usuario + extracción de texto. **Bloquea IPs privadas/localhost (SSRF).**
- `openrouter.ts` — cliente de IA. `extractJson()` saca el objeto JSON aunque el modelo lo envuelva en ```json o lo corte.
- `heuristics.ts` — analizador y scoring **sin IA**. Taxonomía de 14 servicios ES/EN, señales de intención de compra, restadores (noticias, memes, "ya lo tengo").
- `reddit.ts` — API pública de Reddit (OAuth opcional), `buildQueries` y `demoLeads` (fallback determinista).
- `message.ts` — `generateMessageSafe`: IA, y si falla, plantilla con los datos reales del lead.
- `mask.ts` — **enmascarado server-side de la preview anónima**.
- `auth.ts` — sesiones. `getCurrentUser()` es la única puerta de entrada; devuelve `User` **sin `passwordHash`**.
- `db.ts` — dos backends: Supabase (`users`/`searches`/`leads`/`messages`) o JSON local en `.data/`.
- `secret.ts` — secreto de firma en `.data/secret`.
- `api.ts` — contrato de la API + helpers de fetch del cliente + `ApiErrorResponse`.

### Frontend

- `app/page.tsx` — landing (server). `ScanExperience` va dentro de `<Suspense>` porque usa `useSearchParams`.
- `app/dashboard/page.tsx` — server: carga datos y pasa a `DashboardClient`.
- `components/landing/` — `scan-experience.tsx` (máquina de estados `idle → analyzing → results`), `pixelated-results.tsx` (`LeadRow` es compartido con el dashboard), `analyzing.tsx`, `sections.tsx` (stats, cómo funciona, precios, FAQ, teaser de mensajes).
- `components/dashboard/` — `leads-table.tsx` (filtros + búsqueda), `message-panel.tsx` (generar/editar/copiar), `dashboard-client.tsx`.

## Gotchas

- **La app arranca y funciona SIN ninguna variable de entorno.** Sin `OPENROUTER_API_KEY` usa el analizador heurístico; sin `SUPABASE_*` usa auth por cookie firmada y store en `.data/leadscout.json`; si Reddit no responde (403 en IPs de datacenter) genera leads de demostración. Al definir las keys cambia al servicio real sin tocar código. Ver `.env.example`.
- **El pixelado no es solo CSS.** `lib/mask.ts` recorta los leads en el **servidor**; el `filter: blur(6px)` es el finishing touch. Un anónimo nunca recibe `url`, `username`, `snippet` ni `reason`. Hay un test que lo verifica: no rompas `MaskedLead`.
- **El límite de 3 mensajes/semana se comprueba en el servidor** (`app/api/messages`). `PATCH` (editar) no lo consume. La semana es ISO y se calcula en UTC.
- **Aislamiento entre usuarios**: los leads se cargan con `getLeadsForUser(userId)`, nunca por `leadId` suelto. Un lead ajeno devuelve 404.
- **La navbar abre el modal con `router.push("/?auth=signup")`**, que no remonta el componente. Por eso `ScanExperience` usa `useSearchParams` + `handledRef`; con un `useEffect` de solo montaje el modal no abría y había que recargar.
- **Cambiar `tailwind.config.ts` no invalida el CSS de `.next`.** El dev server sigue sirviendo las utilities con los valores viejos: tras pasar a fondo blanco, `.text-ink` seguía valiendo `#fff` y el texto quedaba blanco sobre blanco sin error de build. **Solución: parar el dev server, `rm -rf .next`, arrancar.** Si tocas tokens de color, hazlo siempre.
- **Nunca lances `npm run build` con `next dev` corriendo**: los dos escriben en `.next` y corrompen el CSS servido (página sin estilos). Para el build, para el dev server antes.
- **`.data/` está en `.gitignore`**: contiene el secret y la base de datos local de desarrollo.
- **Reddit devuelve 403 desde IPs de datacenter.** Es normal en local; por eso existe `demoLeads`. La etiqueta `live: false` y el badge "Dataset de demostración" son intencionales.
- **El botón de Google se muestra siempre**, tenga o no Supabase configurado. Si faltan `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `handleGoogle` (en `components/auth/auth-modal.tsx`) lo explica en el modal en vez de dejar un botón muerto. Ya no existe la prop `googleEnabled`: si la añades de vuelta para ocultarlo, recuerda que es una decisión de producto, no un detalle técnico.
- **El `title` de cada página se escribe entero y a mano.** Un `title` en string de una página sustituye al del `layout` y **no** hereda su `template` (`"%s · LeadScout"`), así que la pestaña de Chrome se queda sin marca si no la incluyas. Hoy ambas páginas usan `"LeadScout"`, que es lo que el usuario quiere ver arriba.
- `metadata` de `/dashboard` es `robots: noindex`. Las páginas son dinámicas (leen cookies), nada de `output: "export"`.

## Estilo

- Paleta en `tailwind.config.ts`: `bg #ffffff`, `bg-2 #f4f7f5`, `accent #15803d`, `accent-dim #166534`, `line #dde5e0`, `ink #0f1a14`, `ink-2 #4b574f`. Fondo **blanco**; el verde se oscureció a `#15803d` porque es el tono más claro que todavía da 5:1 con texto blanco, y los botones (`text-white` sobre `bg-accent`) y el texto de acento necesitan AA sobre blanco.
- Títulos en serif (`Playfair Display`), UI en sans (`Inter`); ambas vía `next/font` con variables CSS.
- Clases reutilizables en `app/globals.css` (`.btn-accent`, `.card`, `.input`, `.badge`, `.pixelated`, `.locked-veil`, `.container-page`).
- `app/layout.tsx` lleva `backgroundColor` **inline** (`#ffffff`) en `<html>` y `<body>` a propósito: evita el flash si el CSS tarda o queda cacheado.
- `color-scheme: light` en `globals.css` y en el `viewport`: sin esto el navegador pinta los scrollbars oscuros y los `autofill` en negro.
