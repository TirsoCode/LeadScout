/**
 * Cliente de Supabase para el navegador.
 *
 * Solo se usa para el login con Google (el email/password va por API route).
 * Si no hay variables de entorno devuelve null y la UI avisa en vez de dejar
 * un botón muerto.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let attempted = false;

export function supabaseEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getBrowserSupabase(): SupabaseClient | null {
  if (!supabaseEnabled()) return null;
  if (client || attempted) return client;

  attempted = true;
  // Import diferido: si no hay claves, nunca se carga el bundle de Supabase.
  void import("@supabase/ssr").then(({ createBrowserClient }) => {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  });

  // La primera llamada devuelve null mientras se carga; para el botón de
  // Google solo necesitamos saber que está habilitado, y el usuario tarda
  // más de un frame en poder hacer clic.
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
