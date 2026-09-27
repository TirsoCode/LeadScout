/**
 * Cliente de OpenRouter.
 *
 * Si no hay OPENROUTER_API_KEY este módulo NO se usa: las funciones de alto
 * nivel (`analyzeBusiness`, `scoreLeads`, `generateMessage`) caen automaticamente
 * en los equivalentes heuristicos de lib/heuristics.ts, de modo que la app
 * funciona completa en local sin credenciales.
 */

import type { BusinessProfile, Lead } from "./types";
import {
  analyzeBusinessHeuristic,
  scoreLeadsHeuristic,
  suggestKeywordsHeuristic,
} from "./heuristics";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct";

export function hasOpenRouter(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/** Llama al modelo y devuelve texto plano. Lanza si la API falla. */
async function complete(
  system: string,
  user: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY no configurada");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": "LeadScout",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 900,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Los modelos pequeños(no-JSON) a veces envuelven el JSON en ```json ... ```.
 * Extraemos el primer objeto balanceado que aparezca en el texto.
 */
export function extractJson(raw: string): unknown {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    /* seguimos buscando */
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* seguimos buscando */
    }
  }

  const start = text.indexOf("{");
  if (start === -1) throw new Error("El modelo no devolvió JSON");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("JSON del modelo incompleto");
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter(Boolean)
    .slice(0, max);
}

export async function analyzeBusiness(
  input: { url: string; title: string; description: string; text: string },
): Promise<BusinessProfile> {
  const system = [
    "Eres un analista de mercado. Lees la web de un negocio y extraes su perfil comercial.",
    "Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto alrededor, sin markdown.",
    'Formato exacto: {"businessName":string,"service":string,"audience":string,',
    '"keywords":string[],"problems":string[],"niche":string,"summary":string}',
    "Reglas: businessName = nombre real del negocio o su dominio. service = qué vende en una frase.",
    "audience = quién es su cliente. keywords = 5-8 términos EN INGLÉS que usaría su cliente",
    "buscando ese servicio en Reddit (no traduzcas, Reddit es en inglés). problems = 3-5 problemas",
    "que resuelve. niche = una palabra en minúsculas. summary = 1-2 frases. Nada de inventar datos.",
  ].join(" ");

  const user = [
    `URL: ${input.url}`,
    `Título: ${input.title || "(sin título)"}`,
    `Meta description: ${input.description || "(ninguna)"}`,
    "",
    "Contenido de la página:",
    input.text,
  ].join("\n");

  const raw = await complete(system, user, { maxTokens: 700, temperature: 0.2 });
  const data = (extractJson(raw) ?? {}) as Record<string, unknown>;

  const keywords = asStringArray(data.keywords, 8);
  return {
    businessName: asString(data.businessName, new URL(input.url).hostname.replace(/^www\./, "")),
    url: input.url,
    service: asString(data.service, input.title || "Negocio online"),
    audience: asString(data.audience, "Empresas y profesionales"),
    keywords: keywords.length ? keywords : suggestKeywordsHeuristic(input.text, input.title),
    problems: asStringArray(data.problems, 5),
    niche: (asString(data.niche, "general") || "general").toLowerCase(),
    summary: asString(data.summary, input.description),
    source: "ai",
  };
}

/** Analiza la web; si OpenRouter falla, cae al analizador heuristico. */
export async function analyzeBusinessSafe(
  input: { url: string; title: string; description: string; text: string },
): Promise<BusinessProfile> {
  if (!hasOpenRouter()) return analyzeBusinessHeuristic(input);
  try {
    return await analyzeBusiness(input);
  } catch (err) {
    console.error("[openrouter] analyzeBusiness:", err);
    return analyzeBusinessHeuristic(input);
  }
}

const SCORE_SYSTEM = [
  "Eres un lead scorer. Para cada post de Reddit decides cuanto encaja con el servicio",
  "que ofrece el negocio, y por que. Responde SOLO con un array JSON:",
  '[{"id":string,"matchScore":number,"reason":string}]',
  "matchScore: 0-100. Racionalo: 90+ = pide explicitamente el servicio o tiene el problema exacto.",
  "70-89 = problema relacionado claro. 40-69 = tema tangencial. <40 = no es lead.",
  'reason: UNA frase en español, max 110 caracteres, concreta (menciona lo que pide la persona).',
  "Sin comillas dobles dentro del texto, sin emojis, sin markdown. Mantén el orden de los ids.",
].join(" ");

export async function scoreLeads(
  business: BusinessProfile,
  leads: Lead[],
): Promise<Map<string, { matchScore: number; reason: string }>> {
  if (leads.length === 0) return new Map();

  const system = SCORE_SYSTEM;
  const user = [
    "NEGOCIO:",
    `- Servicio: ${business.service}`,
    `- Cliente ideal: ${business.audience}`,
    `- Palabras clave: ${business.keywords.join(", ")}`,
    "",
    "POSTS:",
    ...leads.map(
      (lead) =>
        `[${lead.id}] r/${lead.community ?? "?"} | u/${lead.username}: "${lead.title} — ${lead.snippet}"`,
    ),
  ].join("\n");

  const raw = await complete(system, user, { maxTokens: 1400, temperature: 0.2 });
  const parsed = extractJson(raw) as unknown;

  const rows: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { leads?: unknown[] })?.leads)
      ? ((parsed as { leads: unknown[] }).leads)
      : [];

  const out = new Map<string, { matchScore: number; reason: string }>();
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const record = row as Record<string, unknown>;
    const id = asString(record.id);
    if (!id) continue;
    const score = Number(record.matchScore);
    if (!Number.isFinite(score)) continue;
    out.set(id, {
      matchScore: Math.max(0, Math.min(100, Math.round(score))),
      reason: asString(record.reason, "Encaje razonable con el servicio."),
    });
  }
  return out;
}

/** Puntuaciona los leads; si OpenRouter falla, cae al scoring heuristico. */
export async function scoreLeadsSafe(
  business: BusinessProfile,
  leads: Lead[],
): Promise<Map<string, { matchScore: number; reason: string }>> {
  if (!hasOpenRouter() || leads.length === 0) return scoreLeadsHeuristic(business, leads);
  try {
    const scored = await scoreLeads(business, leads);
    // Si el modelo no devolvio nada util, no dejamos los leads sin score.
    return scored.size > 0 ? scored : scoreLeadsHeuristic(business, leads);
  } catch (err) {
    console.error("[openrouter] scoreLeads:", err);
    return scoreLeadsHeuristic(business, leads);
  }
}

const MESSAGE_SYSTEM = [
  "Eres un comercial de ventas que escribe a un prospecto por LinkedIn o Reddit.",
  "Escribes UN solo mensaje corto, en español, en el idioma del texto que te dan.",
  "Tono: profesional pero humano, como un mensaje real, NO spam.",
  "Máximo 70 palabras. Sin emojis. Sin 'Estimado'. Sin muletillas tipo 'espero que este",
  "mensaje le sea util'. Empieza por algo especifico de la persona o de su problema.",
  "Di en una frase qué haces y por que le encaja. Cierra con UNA pregunta concreta o un",
  "called to action suave. NO inventes datos, cifras, clientes anteriores ni precios.",
  "NO uses placeholders tipo [nombre] o [empresa]: escribe los nombres reales que te den.",
  "Si el mensaje es para Reddit, NO incluyas enlace: se percibe como spam.",
  "Responde SOLO con el texto del mensaje, sin comillas, sin preámbulo, sin markdown.",
].join(" ");

export async function generateMessage(
  business: BusinessProfile,
  lead: Lead,
): Promise<string> {
  const system = MESSAGE_SYSTEM;
  const user = [
    "TU NEGOCIO:",
    `- Nombre: ${business.businessName}`,
    `- Qué hace: ${business.service}`,
    `- A quién ayuda: ${business.audience}`,
    `- Resuelve: ${business.problems.slice(0, 3).join("; ") || business.service}`,
    "",
    "EL PROSPECTO:",
    `- Nombre: ${lead.name}`,
    `- Cargo/título: ${lead.title}`,
    `- Dónde: ${lead.platform === "reddit" ? `r/${lead.community}` : "LinkedIn"} (u/${lead.username})`,
    `- Qué dice/hace: ${lead.snippet}`,
    `- Por qué es un lead (${lead.matchScore}% de afinidad): ${lead.reason}`,
    "",
    "Escribe el mensaje.",
  ].join("\n");

  const raw = await complete(system, user, { maxTokens: 320, temperature: 0.6 });
  return raw.trim().replace(/^["'`]+|["'`]+$/g, "").slice(0, 1400);
}
