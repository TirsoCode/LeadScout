/**
 * /api/leads — estado propio del usuario sobre sus leads.
 *
 *  PATCH { id, favorite }   marca o desmarca un lead como favorito
 *
 * Solo afecta a leads COMPLETOS y de searches del usuario: `setLeadFavorite`
 * filtra por los `search_id` de quien pregunta, así que un lead ajeno devuelve
 * 404 en vez de 403 (no le confirmamos ni que existe).
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setLeadFavorite } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });
  }

  let body: { id?: unknown; favorite?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; favorite?: unknown };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Falta el lead." }, { status: 400 });
  if (typeof body.favorite !== "boolean") {
    return NextResponse.json({ error: "El valor de favorite debe ser true o false." }, { status: 400 });
  }

  const lead = await setLeadFavorite(user.id, id, body.favorite);
  if (!lead) {
    return NextResponse.json(
      { error: "Ese lead no existe o no es tuyo." },
      { status: 404 },
    );
  }

  return NextResponse.json({ lead });
}
