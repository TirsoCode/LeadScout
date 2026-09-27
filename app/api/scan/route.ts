/**
 * POST /api/scan — el paso 2-4 del flujo: analiza la web y devuelve los leads.
 *
 * Sin sesión: devuelve los leads MASCARADOS (lib/mask.ts) y deja el searchId en
 * una cookie httpOnly para poder "reclamar" esa búsqueda al registrarse.
 * Con sesión: devuelve los leads completos.
 */

import { NextResponse } from "next/server";
import { getCurrentUser, setPreviewCookie } from "@/lib/auth";
import { maskLead } from "@/lib/mask";
import { newSearchId, runScan } from "@/lib/scan";
import { saveLeads, saveSearch } from "@/lib/db";
import { LEADS_SHOWN } from "@/lib/types";

export const runtime = "nodejs";
// El análisis depende de APIs externas: nunca lo cacheamos.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const url = typeof body === "object" && body !== null ? (body as { url?: unknown }).url : undefined;
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "Falta la URL." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const searchId = newSearchId();

  const { result, error } = await runScan(url, searchId);
  if (!result) {
    return NextResponse.json({ error: error ?? "No se pudo completar el análisis." }, { status: 422 });
  }

  // Guardamos siempre: el preview pre-registro también se conserva para que al
  // registrarse el usuario recupere exactamente esos leads.
  await saveSearch({
    id: result.searchId,
    userId: user?.id ?? null,
    url: result.business.url,
    business: result.business,
    live: result.live,
    createdAt: result.createdAt,
  });
  await saveLeads(result.leads);

  if (!user) setPreviewCookie(result.searchId);

  const base = {
    searchId: result.searchId,
    business: result.business,
    live: result.live,
    createdAt: result.createdAt,
    unlocked: Boolean(user),
  };

  if (!user) {
    return NextResponse.json({
      ...base,
      total: result.leads.length,
      leads: result.leads.slice(0, LEADS_SHOWN).map(maskLead),
    });
  }

  return NextResponse.json({ ...base, total: result.leads.length, leads: result.leads });
}
