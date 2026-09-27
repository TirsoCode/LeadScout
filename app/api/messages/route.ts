/**
 * /api/messages — generación y gestión de mensajes IA.
 *
 *  POST  { leadId }          genera un mensaje para ese lead (gasta cuota)
 *  PATCH { id, body }        guarda las ediciones del usuario (gratis, sin cuota)
 *  GET                      lista los mensajes del usuario
 *
 * El límite de 3/semana del plan gratis se comprueba SIEMPRE en el servidor:
 * el cliente puede mentir, el servidor no.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  countMessagesThisWeek,
  getLeadsForUser,
  getMessagesForUser,
  getSearchesForUser,
  saveMessage,
} from "@/lib/db";
import { generateMessageSafe } from "@/lib/message";
import { FREE_WEEKLY_MESSAGE_LIMIT, type Message } from "@/lib/types";
import { randomId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const messages = await getMessagesForUser(user.id);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: { leadId?: unknown };
  try {
    body = (await request.json()) as { leadId?: unknown };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  if (!leadId) return NextResponse.json({ error: "Falta el lead." }, { status: 400 });

  // Comprobamos la cuota antes de gastar nada.
  const used = await countMessagesThisWeek(user.id);
  if (used >= FREE_WEEKLY_MESSAGE_LIMIT) {
    const week = new Date(Date.now() + 7 * 86_400_000).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });
    return NextResponse.json(
      {
        error: `Has usado tus ${FREE_WEEKLY_MESSAGE_LIMIT} mensajes de esta semana.`,
        code: "QUOTA_EXCEEDED",
        resetDate: week,
        quota: { used, limit: FREE_WEEKLY_MESSAGE_LIMIT, remaining: 0 },
      },
      { status: 429 },
    );
  }

  // Localizamos el lead entre las búsquedas del usuario (nunca de otro usuario).
  const [leads, searches] = await Promise.all([getLeadsForUser(user.id), getSearchesForUser(user.id)]);
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) {
    return NextResponse.json({ error: "Ese lead no existe o no es tuyo." }, { status: 404 });
  }
  const search = searches.find((item) => item.id === lead.searchId);
  if (!search) {
    return NextResponse.json({ error: "No encontramos la búsqueda de ese lead." }, { status: 404 });
  }

  const generated = await generateMessageSafe(search.business, lead);

  const message: Message = {
    id: randomId("msg"),
    userId: user.id,
    leadId: lead.id,
    body: generated.body,
    createdAt: new Date().toISOString(),
  };
  await saveMessage(message);

  const after = used + 1;
  return NextResponse.json({
    message,
    source: generated.source,
    quota: { used: after, limit: FREE_WEEKLY_MESSAGE_LIMIT, remaining: Math.max(0, FREE_WEEKLY_MESSAGE_LIMIT - after) },
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: { id?: unknown; text?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; text?: unknown };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!id) return NextResponse.json({ error: "Falta el id del mensaje." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 400 });

  const messages = await getMessagesForUser(user.id);
  const existing = messages.find((item) => item.id === id);
  if (!existing) {
    return NextResponse.json({ error: "Ese mensaje no existe o no es tuyo." }, { status: 404 });
  }

  // Editar no gasta cuota (SPEC.md: "puede editar mensajes viejos sin límite").
  const updated: Message = { ...existing, body: text, editedAt: new Date().toISOString() };
  await saveMessage(updated);

  return NextResponse.json({ message: updated });
}
