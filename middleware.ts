/**
 * Refresh de la sesión de Supabase.
 *
 * Con @supabase/ssr la sesión viaja en cookies. `getCurrentUser()` la lee, pero
 * los Server Components no pueden escribir cookies, así que sin este middleware
 * el token caducaría a la hora (1 h) y el usuario se caería del dashboard sin
 * haber pulsado "Salir".
 *
 * El middleware sí puede escribir cookies (Set-Cookie en la respuesta), así que
 * es el sitio correcto para renovar el token: `getClaims()` verifica el JWT y, si
 * está caducado, refresca la sesión escribiendo las cookies nuevas.
 *
 * Sin variables de Supabase el middleware no hace nada y la app sigue con el
 * modo local (cookie firmada en lib/auth.ts).
 */

import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  // `response` se reconstruye en cuanto Supabase quiere escribir cookies: por eso
  // se declara con `let` y se reasigna dentro de `setAll`.
  let response = NextResponse.next({ request });

  const { createServerClient } = await import("@supabase/ssr");
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        for (const { name, value } of items) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) {
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
        }
      },
    },
  });

  // No comprobamos nada con el resultado: si el token no vale, `getClaims`
  // limpia las cookies y la petición sigue como anónima.
  await supabase.auth.getClaims().catch(() => undefined);

  return response;
}

export const config = {
  matcher: [
    /*
     * Todo menos estáticos e imágenes: /api/* también pasa por aquí, que es
     * justo lo que quiere (un POST a /api/messages con el token caducado
     * devuelve 401 en vez de guardarse un mensaje sin sesión).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
