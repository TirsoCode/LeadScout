/**
 * Cliente de Supabase para el navegador.
 *
 * Solo se usa para el login con Google (el email/password va por API route).
 * Si no hay variables de entorno devuelve null y la UI avisa en vez de dejar
 * un botón muerto.
 *
 * El bundle de Supabase se carga CON import diferido para no descargarlo si
 * las claves no existen; la carga ocurre al primer clic y `handleGoogle` debe
 * ESPERARLA (getBrowserSupabaseAsync) — si no, el primer clic fallaba con
 * "no disponible" y el segundo funcionaba.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let clientPromise: Promise<SupabaseClient | null> | null = null;

export function supabaseEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function loadClient(): Promise<SupabaseClient | null> {
  if (!supabaseEnabled()) return Promise.resolve(null);
  if (clientPromise) return clientPromise;

  // Import diferido: si no hay claves, nunca se carga el bundle de Supabase.
  clientPromise = import("@supabase/ssr")
    .then(({ createBrowserClient }) => {
      client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      return client;
    })
    .catch(() => null);
  return clientPromise;
}

/**
 * Espera (si hace falta) a que el cliente esté listo. Esta es la puerta que
 * usa el botón de Google: el primer clic carga el bundle y devuelve el
 * cliente sin el falso negativo de "providers no disponible".
 */
export async function getBrowserSupabaseAsync(): Promise<SupabaseClient | null> {
  return loadClient();
}

/** Síncrono: útil tras la carga; devuelve null si aún no está listo. */
export function getBrowserSupabase(): SupabaseClient | null {
  return client;
}

/** Cacheado: el botón puede preguntar varias veces en el mismo montaje. */
let googleProbe: Promise<boolean> | null = null;

/**
 * ¿Está el proveedor de Google habilitado en el proyecto?
 *
 * Hace falta porque `signInWithOAuth` NO falla si el proveedor está apagado:
 * construye la URL y navega. El 400 ("provider is not enabled") lo pinta
 * Supabase en su propio dominio, así que el usuario abandona la app y se
 * encuentra una pantalla JSON en blanco. Preguntando antes evitamos eso y
 * podemos explicarlo en la propia pantalla.
 *
 * `auth/v1/settings` es público y no necesita sesión (sí la apikey, que en el
 * navegador es pública por definición).
 */
export function googleProviderEnabled(): Promise<boolean> {
  if (!supabaseEnabled()) return Promise.resolve(false);
  if (googleProbe) return googleProbe;

  googleProbe = fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((settings) => {
      const external = settings?.external?.google;
      return external === true || external?.enabled === true;
    })
    .catch(() => false);

  return googleProbe;
}
