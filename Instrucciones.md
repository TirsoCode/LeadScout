# LeadScout 🎯
> Encuentra clientes potenciales para tu negocio. Automáticamente.

---

## ¿Qué es LeadScout?

LeadScout es un micro SaaS que ayuda a cualquier negocio con web a encontrar clientes potenciales reales usando IA. El usuario entra en la web, pega la URL de su negocio, y la IA analiza qué hace ese negocio, busca en Reddit personas que necesitan exactamente ese servicio, y muestra los resultados con un porcentaje de match.

El truco está en que los resultados aparecen pixelados hasta que te registras. Ves que hay leads ahí, ves los porcentajes, ves que son reales... pero no puedes leerlos. Eso genera una curiosidad brutal que convierte visitas en registros.

---

## ¿Para quién es?

Para cualquier negocio que tenga una web y quiera conseguir clientes:
- Freelancers (diseñadores, developers, redactores...)
- Agencias pequeñas
- SaaS como el propio CVMakerApp
- Consultores
- Cualquier persona con un servicio o producto online

---

## Flujo completo de usuario

### Paso 1 — Landing page
El usuario llega a la web y ve una caja grande en el centro que dice algo como "Enter your website URL". Mete su URL y pulsa el botón. No hace falta registro todavía.

### Paso 2 — Análisis de la web
La IA analiza automáticamente la web del usuario:
- ¿Qué servicio o producto ofrece?
- ¿A quién va dirigido?
- ¿Cuáles son sus keywords principales?
- ¿Qué tipo de cliente necesita?

Esto tarda unos segundos y se muestra una pantalla de carga con algo tipo "Analyzing your business..."

### Paso 3 — Búsqueda de leads
Con ese análisis, la IA busca en Reddit:
- Posts de Reddit donde gente pide ese tipo de servicio
- Conversaciones donde alguien tiene el problema que resuelve tu negocio

### Paso 4 — Resultados pixelados
Aparece una lista de leads. Se puede ver:
- El nombre (pixelado/borroso)
- El cargo o perfil (pixelado)
- El % de match (este SÍ se ve claro, tipo 94%, 87%, 91%...)
- La plataforma (Reddit)
- Un fragmento del por qué es un buen lead (pixelado)

El usuario ve que hay leads reales con porcentajes altos pero no puede leerlos. Abajo aparece un botón: "Unlock your leads — it's free"

### Paso 5 — Registro gratuito
El usuario se registra con email o Google. Sin tarjeta de crédito, sin nada. Completamente gratis. Auth gestionado por Supabase.

### Paso 6 — Dashboard
Una vez registrado ve todos sus leads desbloqueados:
- Nombre y perfil completo
- Plataforma (Reddit)
- % de match y por qué
- Enlace directo al perfil
- Botón "Generate message"

### Paso 7 — Generador de mensajes con IA
El usuario selecciona un lead y pulsa "Generate message". La IA genera un mensaje personalizado para ese lead específico, teniendo en cuenta:
- Lo que hace el negocio del usuario
- El perfil del lead
- Por qué ese lead necesita ese servicio
- Tono profesional pero natural, nada de spam

El mensaje aparece en un editor donde el usuario puede editarlo antes de copiarlo.

### Paso 8 — Límite del plan gratis
En el plan gratis el usuario puede generar 3 mensajes IA por semana. Los leads son ilimitados, la búsqueda es ilimitada, pero los mensajes generados por IA tienen ese límite semanal. Puede editar mensajes viejos o escribir los suyos propios sin límite.

---

## Diseño y estética

### Estilo general
Inspirado en webs SaaS premium modernas. Sensación de herramienta profesional, no de herramienta gratuita de estudiante.

### Paleta de colores
- **Fondo principal:** `#0d2b1e` — verde muy oscuro, casi negro
- **Fondo cards/elementos:** `#1e4a30` — verde medio para separar capas
- **Acento principal:** `#4ade80` — verde brillante para porcentajes de match y CTAs
- **Texto principal:** `#ffffff` — blanco puro
- **Texto secundario:** `#a3b8a8` — gris verdoso suave
- **Bordes:** `#2d5a3d` — verde oscuro sutil

### Landing page
- Hero a pantalla completa con fondo verde oscuro liso (`#0d2b1e`), sin efectos ni gradientes
- Navbar con logo + botones "Sign in" y "Sign up"
- Título grande en tipografía **serif** (igual que ProfScout)
- Input de URL centrado + botón con fondo verde brillante (`#4ade80`) y texto blanco
- Stats debajo: leads encontrados, nichos cubiertos, usuarios registrados
- Sección de cómo funciona en 3 pasos
- Footer con columnas: Features, Pricing, About — en verde apagado, no brillante

### El efecto pixelado
Es el elemento más importante de la web. Los nombres y datos de los leads aparecen con un blur fuerte en CSS (`filter: blur(6px)`). El porcentaje de match se ve claro y en verde brillante para que llame la atención. El contraste entre "lo que ves" y "lo que no puedes ver" es lo que convierte.

### Dashboard
Limpio, con tabla de leads, filtros por plataforma y por % de match, y el generador de mensajes en un panel lateral o modal.

---

## Stack técnico

### Frontend
- **Next.js** — Framework principal
- **Tailwind CSS** — Estilos
- **Vercel** — Deploy

### Backend
- **Next.js API Routes** — Para no necesitar un servidor separado

### IA
- **OpenRouter API** — Con modelos gratuitos (Llama 3.1, Gemma 2, Mistral...) para analizar webs y generar mensajes personalizados. Sin coste.

### Scraping
- **Reddit API** — API oficial gratuita, fácil de usar

### Auth + Base de datos
- **Supabase** — Gestiona tanto la autenticación (email + Google) como la base de datos PostgreSQL. Plan gratuito generoso.

### Tablas en Supabase
- `users` — Datos del usuario y límite de mensajes semanal
- `searches` — Búsquedas realizadas por cada usuario
- `leads` — Leads encontrados con su % de match y datos
- `messages` — Mensajes generados por IA guardados

---

## Cómo funciona la IA por dentro

### Análisis de la web del usuario
Se hace un fetch de la URL que mete el usuario, se extrae el texto principal, y se le manda a OpenRouter con un prompt tipo:
> "Analiza esta web y dime: qué servicio ofrece, a quién va dirigido, qué palabras clave describen a su cliente ideal, y qué problemas resuelve. Responde en JSON."

El modelo devuelve un JSON estructurado con esa información.

### Búsqueda de leads
Con el análisis anterior se construyen queries de búsqueda para Reddit. Por ejemplo si la web es un servicio de diseño de logos, se busca "need a logo designer" o "looking for logo design help" en subreddits relevantes.

### Scoring de match
Para cada lead encontrado, el modelo analiza el perfil o el post y asigna un porcentaje de match basado en qué tan probable es que necesite el servicio. También genera una breve explicación de por qué es un buen lead.

### Generación de mensajes
El modelo recibe el perfil del negocio del usuario + el perfil del lead + la explicación del match y genera un mensaje personalizado. No es una plantilla, es un mensaje real adaptado a cada persona.

---

## Plan de precios

| Plan | Precio | Leads | Mensajes IA |
|------|--------|-------|-------------|
| Free | Gratis | Ilimitados | 3/semana |

Por ahora todo gratis. El objetivo es conseguir usuarios y validar que la gente lo usa de verdad. Cuando haya tracción se puede pensar en un plan de pago con mensajes ilimitados, búsquedas automáticas programadas, o soporte para múltiples webs.

---

## Nombre y dominio

**LeadScout** — Simple, directo, fácil de recordar. Dice exactamente lo que hace.

Deploy en Vercel. Dominio tipo `leadscoutapp.vercel.app` para empezar, luego si funciona se compra el `.com`.

---

## MVP — Lo mínimo para lanzar

Para tener algo que mostrar y conseguir los primeros usuarios solo hace falta:

1. Landing con input de URL
2. Análisis de la web con OpenRouter
3. Búsqueda en Reddit con su API oficial
4. Resultados pixelados
5. Registro con Supabase Auth
6. Dashboard con leads desbloqueados
7. Generador de mensajes básico con límite semanal en Supabase

---

## Siguiente paso inmediato

Diseñar y construir la landing page con el input de URL y el mockup de resultados pixelados.
