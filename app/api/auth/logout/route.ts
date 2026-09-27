/**
 * POST /api/auth/logout — cierra sesión.
 * En modo Supabase cierra la sesión real; en modo local borra la cookie firmada.
 */

import { NextResponse } from "next/server";
import { clearSessionCookie, usingSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (usingSupabase()) {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
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
    await supabase.auth.signOut();
  }

  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
