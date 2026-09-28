/**
 * /api/messages — generación y gestión de mensajes IA.
 *
 *  POST  { leadId }          genera un mensaje para ese lead
 *  PATCH { id, body }        guarda las ediciones del usuario
 *  GET                      lista los mensajes del usuario
 *
 * De momento los mensajes son ILIMITADOS (plan gratis en fase de validación):
 * no hay tope semanal y el servidor nunca bloquea la generación.
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

  const used = await countMessagesThisWeek(user.id).catch(() => 0);
  return NextResponse.json({
    message,
    source: generated.source,
    quota: { used, limit: FREE_WEEKLY_MESSAGE_LIMIT, remaining: 0 },
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

  const updated: Message = { ...existing, body: text, editedAt: new Date().toISOString() };
  await saveMessage(updated);

  return NextResponse.json({ message: updated });
}