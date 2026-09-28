/**
 * GET /auth/callback — vuelta de OAuth (Google).
 *
 * Supabase redirige aquí con `?code=...`; lo canviamos por una sesión y
 * mandamos al usuario al dashboard. Si algo falla, de vuelta a la landing
 * indicando el motivo en la query.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { claimPreviewForUser, upsertSupabaseUser } from "@/lib/db";
import { getPreviewSearchId, clearPreviewCookie, usingSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error_description") ?? searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth?mode=login&err=${encodeURIComponent(String(error))}`,
    );
  }

  if (!usingSupabase()) {
    return NextResponse.redirect(`${origin}/auth?mode=login`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?mode=login`);
  }

  const { createServerClient } = await import("@supabase/ssr");
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          }
        },
      },
    },
  );

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user?.email) {
    return NextResponse.redirect(
      `${origin}/auth?mode=login&err=${encodeURIComponent(
        exchangeError?.message ?? "No se pudo completar el inicio de sesión.",
      )}`,
    );
  }

  await upsertSupabaseUser(data.user.id, data.user.email);
  await claimPreviewForUser(data.user.id, getPreviewSearchId());
  clearPreviewCookie();

  // `next` solo se acepta si es una ruta interna: evita redirecciones abiertas.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
