/**
 * GET /api/auth/session — quién está conectado y cuánto queda del plan gratis.
 * El dashboard lo usa para pintar la cuota de mensajes sin tener que pedirla
 * en cada interacción.
 */

import { NextResponse } from "next/server";
import { getCurrentUser, usingSupabase } from "@/lib/auth";
import { countMessagesThisWeek } from "@/lib/db";
import { FREE_WEEKLY_MESSAGE_LIMIT } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null, mode: usingSupabase() ? "supabase" : "local" });
  }

  const used = await countMessagesThisWeek(user.id).catch(() => 0);

  return NextResponse.json({
    user,
    mode: usingSupabase() ? "supabase" : "local",
    quota: { used, limit: FREE_WEEKLY_MESSAGE_LIMIT, remaining: Math.max(0, FREE_WEEKLY_MESSAGE_LIMIT - used) },
  });
}
