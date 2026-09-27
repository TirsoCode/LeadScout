/**
 * Cliente de Supabase para el navegador.
 *
 * Solo se usa para el login con Google (el email/password va por API route).
 * Si no hay variables de entorno devuelve null y la UI oculta el botón de
 * Google en vez de mostrar un botón que no puede funcionar.
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
