/**
 * Orquestador del scan: URL -> perfil de negocio -> leads con % de match.
 *
 * Es el corazón de producto y se usa tanto desde la landing (preview anónimo,
 * leads pixelados) como desde el dashboard (leads desbloqueados).
 *
 * Nunca lanza por un fallo puntual: si Reddit o OpenRouter fallan, degrada al
 * siguiente nivel (demo leads / heuristico) para que el usuario siempre vea
 * un resultado creible.
 */

import { fetchPage } from "./crawl";
import { analyzeBusinessSafe, scoreLeadsSafe } from "./openrouter";
import { buildQueries, demoLeads, searchReddit } from "./reddit";
import { LEADS_SHOWN, MAX_LEADS_PER_SEARCH, type Lead, type ScanResult } from "./types";
import { validateUrlInput, randomId } from "./utils";

export type ScanOutcome = {
  result: ScanResult | null;
  /** Mensaje para el usuario si el scan no pudo hacerse. */
  error?: string;
};

export async function runScan(inputUrl: string, searchId: string): Promise<ScanOutcome> {
  // Mismo validador que el cliente, para que el mensaje de error coincida
  // llegue cual llegue la petición.
  const validation = validateUrlInput(inputUrl);
  if (!validation.ok) {
    return { result: null, error: validation.error };
  }
  const url = validation.url;

  const page = await fetchPage(url);

  if (!page.ok && !page.text) {
    return {
      result: null,
      error:
        page.error ??
        "No pudimos leer esa web. Comprueba que esté pública y vuelve a intentarlo.",
    };
  }

  // 1. Perfil de negocio (IA o heurístico).
  const business = await analyzeBusinessSafe({
    url: page.url || url,
    title: page.title,
    description: page.description,
    text: page.text,
  });

  // 2. Búsqueda real en Reddit con varias queries.
  const queries = buildQueries(business);
  const perQuery = Math.max(4, Math.ceil(MAX_LEADS_PER_SEARCH / Math.max(queries.length, 1)));

  const batches = await Promise.all(
    queries.map((query) => searchReddit(query, searchId, perQuery).catch(() => null)),
  );

  const seen = new Set<string>();
  const collected: Lead[] = [];
  let live = false;

  for (const batch of batches) {
    if (!batch) continue;
    live = true;
    for (const lead of batch) {
      const key = lead.url.split("?")[0];
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(lead);
      if (collected.length >= MAX_LEADS_PER_SEARCH) break;
    }
    if (collected.length >= MAX_LEADS_PER_SEARCH) break;
  }

  // 3. Sin red -> leads de demostración coherentes con el nicho.
  const leads = collected.length > 0 ? collected : demoLeads(business, searchId);
  if (collected.length === 0) live = false;

  // 4. Scoring de afinidad (IA o heurístico).
  const scores = await scoreLeadsSafe(business, leads);
  for (const lead of leads) {
    const score = scores.get(lead.id);
    if (score) {
      lead.matchScore = score.matchScore;
      lead.reason = score.reason;
    } else {
      lead.matchScore = 50;
      lead.reason = "Coincide con los servicios que ofreces.";
    }
  }

  leads.sort((a, b) => b.matchScore - a.matchScore);

  return {
    result: {
      searchId,
      business,
      leads: leads.slice(0, LEADS_SHOWN),
      live,
      createdAt: new Date().toISOString(),
    },
  };
}

/** Recupera un scan ya hecho (preview guardado en cookie o búsqueda del user). */
export function newSearchId(): string {
  return randomId("search");
}
