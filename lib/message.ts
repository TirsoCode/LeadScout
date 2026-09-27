/**
 * Generación de mensajes de contacto.
 *
 * Con OPENROUTER_API_KEY usa el modelo (mensaje único, adaptado al lead).
 * Sin key compone un mensaje con plantilla a partir de los datos REALES del
 * negocio y del lead: es un fallback funcional, no una respuesta de IA, y la
 * UI lo indica para que el usuario sepa qué está leyendo.
 */

import type { BusinessProfile, Lead } from "./types";
import { generateMessage, hasOpenRouter } from "./openrouter";

export type GeneratedMessage = { body: string; source: "ai" | "template" };

/** Nombre legible de una URL de negocio para meterlo en el mensaje. */
function businessLabel(business: BusinessProfile): string {
  try {
    return new URL(business.url).hostname.replace(/^www\./, "");
  } catch {
    return business.businessName;
  }
}

/**
 * Plantilla determinista. Usa el `reason` del scoring (que ya menciona qué pide
 * la persona) para que el mensaje no suene genérico.
 */
function templateMessage(business: BusinessProfile, lead: Lead): string {
  const host = businessLabel(business);
  const service = business.service.replace(/\.$/, "");

  // Extraemos el problema concreto que la IA (o el heuristico) detectó.
  const problem =
    lead.reason
      .replace(/^Pide explícitamente este servicio en [^.]*\.\s*/i, "")
      .replace(/^Tiene el problema exacto que resuelves y busca soluciones en [^.]*\.\s*/i, "")
      .replace(/^Toca tu área en [^.]*\.\s*/i, "")
      .replace(/^Relación débil con tu servicio en [^.]*\.\s*/i, "")
      .replace(/^[^.]*\.\s*/, "")
      .trim() || service;

  const opener = `Vi tu publicación en r/${lead.community ?? "reddit"} sobre ${problem}.`;

  const value = business.problems[0]
    ? `En ${business.businessName} ayudamos justo con eso: ${business.service.replace(/\.$/, "")}.`
    : `En ${business.businessName} nos dedicamos a ${service}.`;

  const proof = business.summary && business.summary !== business.service
    ? ` Trabajamos con ${business.audience}, así que el contexto lo tenemos controlado.`
    : "";

  const cta = `Si te encaja, te paso un par de ejemplos de trabajo parecido. ¿Te viene bien?`;

  return [opener, `${value}${proof}`, cta].join(" ").slice(0, 900);
}

export async function generateMessageSafe(
  business: BusinessProfile,
  lead: Lead,
): Promise<GeneratedMessage> {
  if (hasOpenRouter()) {
    try {
      const body = await generateMessage(business, lead);
      if (body && body.length > 20) return { body, source: "ai" };
    } catch (err) {
      console.error("[openrouter] generateMessage:", err);
    }
  }
  return { body: templateMessage(business, lead), source: "template" };
}
