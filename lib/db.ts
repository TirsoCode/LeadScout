/**
 * Capa de datos con dos backends intercambiables:
 *
 *  - **Supabase** (si hay NEXT_PUBLIC_SUPABASE_URL + ANON_KEY): tablas
 *    `users`, `searches`, `leads`, `messages` del SPEC.md. Si falta el service
 *    role key, el esquema se crea con `ensureSchema()` en la primera petición.
 *  - **Store local** (sin variables): un único JSON en `.data/leadscout.json`.
 *    development-only, con escrituras serializadas mediante una cola de
 *    promesas para no corromper el archivo.
 *
 * La API pública (findUserByEmail, saveLeads, ...) es la misma en ambos casos,
 * así que el resto de la app no sabe cuál está activo.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BusinessProfile, Lead, Message, User } from "./types";
import { currentIsoWeek } from "./utils";
import { usingSupabase } from "./auth";

export type StoredUser = User & { passwordHash?: string };

export type StoredSearch = {
  id: string;
  userId: string | null;
  url: string;
  business: BusinessProfile;
  live: boolean;
  createdAt: string;
};

type LocalData = {
  users: StoredUser[];
  searches: StoredSearch[];
  leads: Lead[];
  messages: Message[];
};

const EMPTY: LocalData = { users: [], searches: [], leads: [], messages: [] };

// --- store local ------------------------------------------------------------

const DATA_PATH = join(process.cwd(), ".data", "leadscout.json");

/** Cola de escrituras: garantiza que dos requests no se pisen. */
let writeQueue: Promise<unknown> = Promise.resolve();

function readData(): LocalData {
  try {
    if (!existsSync(DATA_PATH)) return structuredClone(EMPTY);
    const parsed = JSON.parse(readFileSync(DATA_PATH, "utf8")) as Partial<LocalData>;
    return {
      users: parsed.users ?? [],
      searches: parsed.searches ?? [],
      leads: parsed.leads ?? [],
      messages: parsed.messages ?? [],
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

function writeData(data: LocalData): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  // Escritura atómica: escribimos a .tmp y renombramos, así un corte de luz a
  // mitad de escritura no deja el JSON corrupto.
  const tmp = `${DATA_PATH}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  renameSync(tmp, DATA_PATH);
}

/** Versión asíncrona real, usada por las funciones públicas. */
async function mutate<T>(fn: (data: LocalData) => T): Promise<T> {
  const task = writeQueue.then(async () => {
    const data = readData();
    const result = fn(data);
    writeData(data);
    return result;
  });
  // La cola sigue viva aunque esta operación falle.
  writeQueue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

async function read<T>(fn: (data: LocalData) => T): Promise<T> {
  await writeQueue;
  return fn(readData());
}

// --- helpers de asignación de usuario --------------------------------------

/** Promesas que un lead pasa de "preview anónimo" a "leads desbloqueados". */
function claimPreview(userId: string, searchId?: string | null): void {
  void (async () => {
    await mutate((data) => {
      const targets = searchId
        ? data.searches.filter((s) => s.id === searchId)
        : data.searches.filter((s) => s.userId === null);
      for (const search of targets) {
        search.userId = userId;
        for (const lead of data.leads) {
          if (lead.searchId === search.id) lead.searchId = search.id;
        }
      }
    });
  })();
}

// --- API pública ------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const needle = email.trim().toLowerCase();
  if (usingSupabase()) {
    const { supabaseUserByEmail } = await supabaseStore();
    return supabaseUserByEmail(needle);
  }
  return read((data) => data.users.find((user) => user.email === needle) ?? null);
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (usingSupabase()) {
    const { supabaseUserById } = await supabaseStore();
    return supabaseUserById(id);
  }
  return read((data) => data.users.find((user) => user.id === id) ?? null);
}

export async function createLocalUser(user: StoredUser): Promise<StoredUser> {
  return mutate((data) => {
    data.users.push(user);
    return user;
  });
}

/** Resuelve el usuario autenticado en Supabase (id = auth.uid). */
export async function upsertSupabaseUser(id: string, email: string): Promise<StoredUser> {
  const { supabaseUpsertUser } = await supabaseStore();
  return supabaseUpsertUser(id, email);
}

export async function saveSearch(search: StoredSearch): Promise<void> {
  if (usingSupabase()) {
    const { supabaseSaveSearch } = await supabaseStore();
    return supabaseSaveSearch(search);
  }
  await mutate((data) => {
    const index = data.searches.findIndex((s) => s.id === search.id);
    if (index >= 0) data.searches[index] = search;
    else data.searches.push(search);
  });
}

export async function saveLeads(leads: Lead[]): Promise<void> {
  if (leads.length === 0) return;
  if (usingSupabase()) {
    const { supabaseSaveLeads } = await supabaseStore();
    return supabaseSaveLeads(leads);
  }
  await mutate((data) => {
    for (const lead of leads) {
      const index = data.leads.findIndex((l) => l.id === lead.id);
      if (index >= 0) data.leads[index] = lead;
      else data.leads.push(lead);
    }
  });
}

export async function getSearchById(id: string): Promise<StoredSearch | null> {
  if (usingSupabase()) {
    const { supabaseGetSearch } = await supabaseStore();
    return supabaseGetSearch(id);
  }
  return read((data) => data.searches.find((s) => s.id === id) ?? null);
}

export async function getSearchesForUser(userId: string): Promise<StoredSearch[]> {
  if (usingSupabase()) {
    const { supabaseGetSearchesForUser } = await supabaseStore();
    return supabaseGetSearchesForUser(userId);
  }
  return read((data) =>
    data.searches
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export async function getLeadsForSearch(searchId: string): Promise<Lead[]> {
  if (usingSupabase()) {
    const { supabaseGetLeads } = await supabaseStore();
    return supabaseGetLeads(searchId);
  }
  return read((data) =>
    data.leads
      .filter((lead) => lead.searchId === searchId)
      .sort((a, b) => b.matchScore - a.matchScore),
  );
}

export async function getLeadsForUser(userId: string): Promise<Lead[]> {
  const searches = await getSearchesForUser(userId);
  if (searches.length === 0) return [];
  const ids = new Set(searches.map((s) => s.id));
  if (usingSupabase()) {
    const { supabaseGetLeadsForSearches } = await supabaseStore();
    return supabaseGetLeadsForSearches([...ids]);
  }
  return read((data) =>
    data.leads.filter((lead) => ids.has(lead.searchId)).sort((a, b) => b.matchScore - a.matchScore),
  );
}

export async function saveMessage(message: Message): Promise<void> {
  if (usingSupabase()) {
    const { supabaseSaveMessage } = await supabaseStore();
    return supabaseSaveMessage(message);
  }
  await mutate((data) => {
    const index = data.messages.findIndex((m) => m.id === message.id);
    if (index >= 0) data.messages[index] = message;
    else data.messages.push(message);
  });
}

export async function getMessagesForUser(userId: string): Promise<Message[]> {
  if (usingSupabase()) {
    const { supabaseGetMessages } = await supabaseStore();
    return supabaseGetMessages(userId);
  }
  return read((data) =>
    data.messages
      .filter((m) => m.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

/** Mensajes generados en la semana ISO actual: base del límite de 3/semana. */
export async function countMessagesThisWeek(userId: string): Promise<number> {
  if (usingSupabase()) {
    const { supabaseCountMessagesThisWeek } = await supabaseStore();
    return supabaseCountMessagesThisWeek(userId);
  }
  const week = currentIsoWeek();
  return read(
    (data) =>
      data.messages.filter(
        (m) => m.userId === userId && currentIsoWeek(new Date(m.createdAt)) === week,
      ).length,
  );
}

/** Enlaza al usuario recién registrado la búsqueda anonymous que tenía en cookie. */
export async function claimPreviewForUser(userId: string, searchId: string | null): Promise<void> {
  if (usingSupabase()) {
    const { supabaseClaimPreview } = await supabaseStore();
    return supabaseClaimPreview(userId, searchId);
  }
  await mutate((data) => {
    const targets = searchId
      ? data.searches.filter((s) => s.id === searchId)
      : data.searches.filter((s) => s.userId === null);
    for (const search of targets) search.userId = userId;
  });
}

// --- backend Supabase -------------------------------------------------------

type SupabaseClient = import("@supabase/supabase-js").SupabaseClient;

let supabasePromise: Promise<SupabaseClient> | null = null;
let schemaEnsured: Promise<void> | null = null;

async function supabaseStore() {
  if (!supabasePromise) {
    supabasePromise = (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
    })();
  }
  const client = await supabasePromise;
  await ensureSchema(client);
  return { client, ...(await buildSupabaseStore(client)) };
}

const SCHEMA_SQL = `
create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.searches (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  url text not null,
  business jsonb not null,
  live boolean not null default false,
  created_at timestamptz not null default now()
);
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
create table if not exists public.messages (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id text not null,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists leads_search_id_idx on public.leads(search_id);
create index if not exists leads_user_search_idx on public.leads(search_id);
create index if not exists messages_user_created_idx on public.messages(user_id, created_at desc);
create index if not exists searches_user_created_idx on public.searches(user_id, created_at desc);
`;

async function ensureSchema(client: SupabaseClient): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return; // sin permiso de DDL
  if (!schemaEnsured) {
    schemaEnsured = (async () => {
      const { error } = await client.rpc("exec_sql", { sql: SCHEMA_SQL });
      if (error) {
        // Si no hay la función exec_sql, el esquema se ha creado a mano desde
        // el panel de Supabase. Lo dejamos pasar con un aviso.
        console.warn(
          "[db] no se pudo crear el esquema automáticamente:",
          error.message,
          "-> aplica supabase/schema.sql en el panel de Supabase.",
        );
      }
    })();
  }
  return schemaEnsured;
}

function mapSearch(row: Record<string, unknown>): StoredSearch {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    url: String(row.url),
    business: row.business as BusinessProfile,
    live: Boolean(row.live),
    createdAt: String(row.created_at),
  };
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    searchId: String(row.search_id),
    platform: row.platform === "linkedin" ? "linkedin" : "reddit",
    name: String(row.name),
    title: String(row.title),
    username: String(row.username),
    url: String(row.url),
    community: (row.community as string | undefined) ?? undefined,
    snippet: String(row.snippet),
    matchScore: Number(row.match_score ?? 0),
    reason: String(row.reason ?? ""),
    origin: row.origin === "demo" ? "demo" : "reddit",
    createdAt: String(row.created_at),
  };
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    leadId: String(row.lead_id),
    body: String(row.body),
    createdAt: String(row.created_at),
    editedAt: (row.edited_at as string | undefined) ?? undefined,
  };
}

async function buildSupabaseStore(client: SupabaseClient) {
  return {
    async supabaseUserByEmail(email: string): Promise<StoredUser | null> {
      const { data } = await client
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (!data) return null;
      return { id: data.id, email: data.email, createdAt: data.created_at };
    },

    async supabaseUserById(id: string): Promise<StoredUser | null> {
      const { data } = await client.from("users").select("*").eq("id", id).maybeSingle();
      if (!data) return null;
      return { id: data.id, email: data.email, createdAt: data.created_at };
    },

    async supabaseUpsertUser(id: string, email: string): Promise<StoredUser> {
      const { data } = await client
        .from("users")
        .upsert({ id, email }, { onConflict: "id" })
        .select("*")
        .single();
      return { id: data.id, email: data.email, createdAt: data.created_at };
    },

    async supabaseSaveSearch(search: StoredSearch): Promise<void> {
      await client.from("searches").upsert({
        id: search.id,
        user_id: search.userId,
        url: search.url,
        business: search.business,
        live: search.live,
        created_at: search.createdAt,
      });
    },

    async supabaseSaveLeads(leads: Lead[]): Promise<void> {
      await client.from("leads").upsert(
        leads.map((lead) => ({
          id: lead.id,
          search_id: lead.searchId,
          platform: lead.platform,
          name: lead.name,
          title: lead.title,
          username: lead.username,
          url: lead.url,
          community: lead.community ?? null,
          snippet: lead.snippet,
          match_score: lead.matchScore,
          reason: lead.reason,
          origin: lead.origin,
          created_at: lead.createdAt,
        })),
      );
    },

    async supabaseGetSearch(id: string): Promise<StoredSearch | null> {
      const { data } = await client.from("searches").select("*").eq("id", id).maybeSingle();
      return data ? mapSearch(data) : null;
    },

    async supabaseGetSearchesForUser(userId: string): Promise<StoredSearch[]> {
      const { data } = await client
        .from("searches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return (data ?? []).map((row) => mapSearch(row));
    },

    async supabaseGetLeads(searchId: string): Promise<Lead[]> {
      const { data } = await client
        .from("leads")
        .select("*")
        .eq("search_id", searchId)
        .order("match_score", { ascending: false });
      return (data ?? []).map((row) => mapLead(row));
    },

    async supabaseGetLeadsForSearches(searchIds: string[]): Promise<Lead[]> {
      const { data } = await client
        .from("leads")
        .select("*")
        .in("search_id", searchIds)
        .order("match_score", { ascending: false });
      return (data ?? []).map((row) => mapLead(row));
    },

    async supabaseSaveMessage(message: Message): Promise<void> {
      await client.from("messages").upsert({
        id: message.id,
        user_id: message.userId,
        lead_id: message.leadId,
        body: message.body,
        created_at: message.createdAt,
        edited_at: message.editedAt ?? null,
      });
    },

    async supabaseGetMessages(userId: string): Promise<Message[]> {
      const { data } = await client
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return (data ?? []).map((row) => mapMessage(row));
    },

    async supabaseCountMessagesThisWeek(userId: string): Promise<number> {
      // Postgres `date_trunc` corre en UTC, que es la base de currentIsoWeek().
      const { count } = await client
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfIsoWeekUtc(new Date()).toISOString());
      return count ?? 0;
    },

    async supabaseClaimPreview(userId: string, searchId: string | null): Promise<void> {
      const query = client.from("searches").update({ user_id: userId });
      if (searchId) await query.eq("id", searchId);
      else await query.is("user_id", null);
    },
  };
}

function startOfIsoWeekUtc(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dayNum - 1));
  return d;
}

export { startOfIsoWeekUtc };
