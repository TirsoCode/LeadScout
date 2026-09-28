-- ---------------------------------------------------------------------------
-- LeadScout — esquema de la aplicación.
--
-- Este archivo es la ÚNICA fuente de verdad del esquema. `lib/db.ts` escribe
-- contra estas columnas tal cual (el mapeo está en mapSearch/mapLead/mapMessage
-- y en el bloque de upserts): si renembras o cambias el tipo de una columna,
-- hay que tocar `lib/db.ts` a la vez.
--
-- Aplicar en el proyecto enlazado:  supabase db push
-- ---------------------------------------------------------------------------

-- users: 1:1 con auth.users. El `id` ES el uid de Supabase (`auth.uid()`).
create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- searches: un scan y el perfil de negocio que se dedujo de la web (jsonb).
-- `user_id` es null mientras la búsqueda es una preview anónima; al
-- registrarse, `claimPreviewForUser` la engancha al usuario nuevo.
create table if not exists public.searches (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  url text not null,
  business jsonb not null,
  live boolean not null default false,
  created_at timestamptz not null default now()
);

-- leads: leads de una búsqueda. Aquí solo se guardan leads COMPLETOS: el
-- enmascarado de la preview anónima se hace al serializar (lib/mask.ts),
-- nunca en la tabla, así que un anónimo no puede deducir nada de la BD.
create table if not exists public.leads (
  id text primary key,
  search_id text not null references public.searches(id) on delete cascade,
  platform text not null,
  name text not null,
  title text not null,
  username text not null,
  url text not null,
  community text,
  snippet text not null,
  match_score integer not null default 0,
  reason text not null default '',
  origin text not null default 'reddit',
  created_at timestamptz not null default now()
);

-- messages: un mensaje por lead y usuario. El límite de 3/semana lo cuenta la
-- app sobre created_at (semana ISO en UTC), no un trigger.
create table if not exists public.messages (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id text not null,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists leads_search_id_idx on public.leads(search_id);
create index if not exists messages_user_created_idx on public.messages(user_id, created_at desc);
create index if not exists searches_user_created_idx on public.searches(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
--
-- `lib/db.ts` habla con la base con la `service_role`, que salta RLS. Estas
-- políticas cierran la puerta a la `anon` key por si algún día se usa desde
-- el cliente: sin sesión no se ve ni una fila.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.searches enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;

drop policy if exists "leadscout: mi usuario" on public.users;
create policy "leadscout: mi usuario" on public.users
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "leadscout: mis búsquedas y las anónimas" on public.searches;
create policy "leadscout: mis búsquedas y las anónimas" on public.searches
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "leadscout: leads de mis búsquedas" on public.leads;
create policy "leadscout: leads de mis búsquedas" on public.leads
  for select to authenticated
  using (
    exists (
      select 1 from public.searches s
      where s.id = leads.search_id and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

drop policy if exists "leadscout: mis mensajes" on public.messages;
create policy "leadscout: mis mensajes" on public.messages
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- La app va siempre con service_role; se deja explícito por si el proyecto
-- tuviese `auto_expose_new_tables = false`.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
