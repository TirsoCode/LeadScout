-- ---------------------------------------------------------------------------
-- LeadScout — lead marcado como favorito.
--
-- Es estado POR USUARIO, pero un lead pertenece a un único `search_id`, y cada
-- search pertenece a un único `user_id`. Eso significa que la columna puede
-- vivir en `leads` sin montar una tabla puente `favorites`: no existe el caso
-- de que dos usuarios compartan el mismo lead.
--
-- La escribe `app/api/leads/route.ts` (PATCH), que valida que el lead sea de
-- las búsquedas del usuario antes de tocar nada.
--
-- Aplicar:  supabase db push
-- ---------------------------------------------------------------------------

alter table public.leads
  add column if not exists favorite boolean not null default false;

-- El dashboard filtra por favoritos a menudo. Índice parcial: solo indexa las
-- filas marcadas, así que no engorda lo que hay en la tabla.
create index if not exists leads_favorite_idx
  on public.leads(search_id)
  where favorite;
