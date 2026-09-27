/**
 * Analizador y scoring heuristicos.
 *
 * Son el fallback que permite que LeadScout funcione entero en local sin
 * OPENROUTER_API_KEY. No pretende igualar a un LLM, pero produce resultados
 * coherentes: extrae keywords reales del texto, detecta el nicho y puntua
 * leads por señales de intención + solapamiento de keywords.
 *
 * No importa nada de lib/openrouter.ts (evita ciclo de imports).
 */

import type { BusinessProfile, Lead } from "./types";
import { truncate } from "./utils";

/** Stopwords inglesas + españolas para no contaminar la extracción. */
const STOPWORDS = new Set(
  `the a an and or but if then else of to in on at by for with from into over under about as is are was were be been being it its this that these those we you they he she i my our your their them us not no so than too very can will just don should now do does did doing have has had having about above after again against all also am any because before below between both but each few further here how more most other once only own same some such then there these those through under until up what when where which while who whom why with your you yours our ours
  el la los las un una unos unas y o pero si entonces de del al a en para por con sin sobre bajo entre cada mas muy ya no se su sus mi mis tu tus le les lo es son era eran ser estar tiene tienen tener hizo hacen hacer muy como donde cuando cual cuales porque pero si sin sobre todo todos toda todas este esta esto ese esa
  home about contact services service portfolio pricing blog news team work working more read learn get started request free now new our us we`
    .split(/\s+/)
    .filter(Boolean),
);

/**
 * Taxonomia de servicios: término detecto -> keywords EN INGLES para buscar
 * en Reddit (que está en inglés) + problemas típicos del cliente.
 */
const SERVICE_TAXONOMY: {
  match: string[];
  niche: string;
  label: string;
  audience: string;
  keywords: string[];
  problems: string[];
}[] = [
  {
    match: ["logo", "branding", "marca", "identidad corporativa", "logotipo", "brand identity"],
    niche: "branding",
    label: "diseño de logotipos y branding",
    audience: "emprendedores y pequeñas marcas que necesitan identidad visual",
    keywords: ["need a logo designer", "logo design help", "hiring a graphic designer", "brand identity design"],
    problems: ["no tiene logo", "su marca se ve amateur", "quiere rediseñar su identidad"],
  },
  {
    match: ["web design", "diseño web", "diseñador web", "webflow", "wordpress", "página web", "responsive"],
    niche: "web design",
    label: "diseño y desarrollo web",
    audience: "pymes y negocios que quieren una web profesional",
    keywords: ["need a web designer", "looking for a website", "hire web developer", "redesign my website"],
    problems: ["su web está anticuada", "necesita una web nueva", "va lenta o no es responsive"],
  },
  {
    match: ["app development", "desarrollo de apps", "desarrollador", "software", "saas", "api", "developer"],
    niche: "software",
    label: "desarrollo de software y apps",
    audience: "startups y empresas que necesitan producto digital",
    keywords: ["need a developer", "looking for a developer", "hire freelance developer", "build an app"],
    problems: ["no tiene equipo técnico", "necesita una app a medida", "proyecto no avanza"],
  },
  {
    match: ["copywriting", "redacción", "redactor", " copywriting", "ghostwriting", "contenido", "copywriter"],
    niche: "copywriting",
    label: " copywriting y contenido",
    audience: "negocios que necesitan textos que vendan",
    keywords: ["need a copywriter", "looking for a writer", "hire ghostwriter", "website copy help"],
    problems: ["su web no convierte", "no sabe escribir para vender", "necesita contenido constante"],
  },
  {
    match: ["marketing digital", "seo", "sem", "publicidad", "google ads", "campañas", "growth"],
    niche: "marketing",
    label: "marketing digital y SEO",
    audience: "empresas que quieren más clientes con tráfego pagado y orgánico",
    keywords: ["need an SEO expert", "looking for marketing help", "hire SEO agency", "google ads help"],
    problems: ["no llega a su público", "la web no aparece en Google", "invierte en anuncios sin resultado"],
  },
  {
    match: ["abogado", "attorney", "law firm", "legal", "jurídic", "derecho", "lawyer"],
    niche: "legal",
    label: "servicios legales",
    audience: "particulares y empresas con un asunto legal",
    keywords: ["need a lawyer", "looking for an attorney", "legal advice", "hire a law firm"],
    problems: ["tiene un conflicto legal", "no sabe cómo reclamar", "necesita representación"],
  },
  {
    match: ["dentista", "dental", "clínica", "clinic", "odontolog", "medic", "health"],
    niche: "health",
    label: "servicios de salud",
    audience: "pacientes y clínicas locales",
    keywords: ["looking for a dentist", "need a doctor", "looking for a clinic", "medical advice"],
    problems: ["busca cita", "no encuentra profesional", "necesita segunda opinión"],
  },
  {
    match: ["inmobiliaria", "real estate", "propiedades", "alquiler", "broker"],
    niche: "real estate",
    label: "inmobiliaria",
    audience: "propietarios y personas que buscan vivienda",
    keywords: ["looking for a realtor", "need a real estate agent", "looking for an apartment", "homes for sale"],
    problems: ["vende su piso", "busca alquiler", "no encuentra casa"],
  },
  {
    match: ["ecommerce", "e-commerce", "tienda online", "shopify", "woocommerce", "online store", "tienda"],
    niche: "ecommerce",
    label: "tienda online",
    audience: "comerciantes que venden por internet",
    keywords: ["need a shopify developer", "ecommerce help", "looking for web store", "online store setup"],
    problems: ["su tienda no vende", "quiere cambiar de plataforma", "problemas de pago"],
  },
  {
    match: ["diseño gráfico", "graphic design", "ilustración", "illustration", "diseñador gráfico", "imagen"],
    niche: "design",
    label: "diseño gráfico",
    audience: "marcas que necesitan piezas visuales",
    keywords: ["need a graphic designer", "looking for an illustrator", "hire designer", "thumbnail design"],
    problems: ["necesita imágenes", "sus diseños no parecen profesionales", "quiere actualizar su identidad visual"],
  },
  {
    match: ["traducción", "translation", "localización", "localization", "traductor"],
    niche: "translation",
    label: "traducción y localización",
    audience: "empresas que necesitan traducciones profesionales",
    keywords: ["need a translator", "looking for translation services", "hire translator"],
    problems: ["necesita traducir su web", "documentación sin traducir", "error de idioma en su marca"],
  },
  {
    match: ["video", "vídeo", "edición de video", "motion", "animación", "fotografía", "photo"],
    niche: "video",
    label: "vídeo y foto",
    audience: "marcas que necesitan contenido audiovisual",
    keywords: ["need a video editor", "looking for a videographer", "hire motion designer"],
    problems: ["necesita editar vídeos", "su contenido no engancha", "producción de vídeo para redes"],
  },
  {
    match: ["consultor", "consulting", "asesor", "advisory", "estrategia"],
    niche: "consulting",
    label: "consultoría",
    audience: "empresas que quieren mejorar su estrategia",
    keywords: ["need a consultant", "looking for consulting help", "hire a business consultant"],
    problems: ["no sabe por dónde empezar", "necesita una segunda opinión", "plan que no funciona"],
  },
  {
    match: ["seo local", "redes sociales", "social media", "community manager", "gestión de redes"],
    niche: "social media",
    label: "gestión de redes sociales",
    audience: "negocios que quieren crecer en redes",
    keywords: ["need a social media manager", "looking for someone to manage my instagram", "hire content creator"],
    problems: ["publica sin estrategia", "no consigue seguidores", "su feed está abandonado"],
  },
];

/** Detecta el nicho del negocio por keywords en titulo/descripcion/texto. */
function detectNiche(haystack: string) {
  let best: (typeof SERVICE_TAXONOMY)[number] | null = null;
  let bestHits = 0;
  for (const entry of SERVICE_TAXONOMY) {
    const hits = entry.match.filter((term) => haystack.includes(term)).length;
    if (hits > bestHits) {
      best = entry;
      bestHits = hits;
    }
  }
  return { entry: best, hits: bestHits };
}

/** Extrae las palabras inglesas mas relevantes del contenido. */
export function suggestKeywordsHeuristic(text: string, title = ""): string[] {
  const haystack = `${title} ${text}`.toLowerCase();

  const entry = detectNiche(haystack);
  if (entry.entry && entry.hits > 0) return [...entry.entry.keywords];

  const freq = new Map<string, number>();
  for (const word of haystack.split(/[^a-z0-9+#.-]+/)) {
    const clean = word.replace(/^[.-]+|[.-]+$/g, "");
    if (clean.length < 4 || clean.length > 22) continue;
    if (STOPWORDS.has(clean) || /^\d+$/.test(clean)) continue;
    freq.set(clean, (freq.get(clean) ?? 0) + 1);
  }

  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);

  if (top.length === 0) return ["need a freelancer", "looking for help", "recommendations"];

  return [
    `need a ${top[0]}`,
    `looking for ${top[1] ?? top[0]}`,
    `hire ${top[2] ?? top[0]}`,
    `recommendations for ${top[3] ?? top[0]}`,
  ];
}

export function analyzeBusinessHeuristic(input: {
  url: string;
  title: string;
  description: string;
  text: string;
}): BusinessProfile {
  const haystack = `${input.title} ${input.description} ${input.text}`.toLowerCase();
  const { entry, hits } = detectNiche(haystack);
  const hostname = new URL(input.url).hostname.replace(/^www\./, "");

  const nameMatch = input.title.match(/^(.{2,60}?)\s*[|–—-]\s*(.{2,60})$/);
  const businessName =
    nameMatch?.[1]?.trim() || hostname.split(".")[0]?.replace(/[-_]/g, " ");

  const service =
    hits > 0 && entry
      ? entry.label
      : truncate(
          input.description || input.text.split(/[.!?\n]/).find((s) => s.trim().length > 40)?.trim() || "",
          140,
        ) || "Negocio online";

  const audience =
    hits > 0 && entry
      ? entry.audience
      : "Empresas y profesionales que necesitan este servicio";

  const keywords =
    hits > 0 && entry ? entry.keywords : suggestKeywordsHeuristic(input.text, input.title);

  const problems =
    hits > 0 && entry ? entry.problems : ["Necesitan contratar a alguien para resolverlo"];

  return {
    businessName: businessName || hostname,
    url: input.url,
    service,
    audience,
    keywords,
    problems,
    niche: hits > 0 && entry ? entry.niche : "general",
    summary: truncate(input.description || input.title, 180) || `Negocio en ${hostname}`,
    source: "heuristic",
  };
}

/**
 * Señales de intención de compra en el post. Cuanto más peso, más probable es
 * que la persona esté buscando actively al proveedor que ofrece el negocio.
 */
const INTENT_SIGNALS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\b(?:looking for|need|needs|searching for|in need of)\b/i, weight: 26 },
  { pattern: /\b(?:hire|hiring|recruit|looking to hire|contract(?:or|ing)?)\b/i, weight: 24 },
  { pattern: /\b(?:recommend(?:ation|ations)?|suggestions?|advice|any ideas|help me out)\b/i, weight: 18 },
  { pattern: /\b(?:anyone know|does anyone|can someone|who can|where can i find)\b/i, weight: 14 },
  { pattern: /\b(?:how much|what'?s the cost|price|pricing|rates?|budget|quote|cost)\b/i, weight: 12 },
  { pattern: /\b(?:freelance|freelancer|agency|contractor|consultant|expert|professional|studio|company)\b/i, weight: 10 },
  { pattern: /\b(?:urgent|asap|deadline|this week|quickly)\b/i, weight: 8 },
  { pattern: /\b(?:struggling|struggle|frustrated|not working|failed|broken|no luck|outdated)\b/i, weight: 9 },
  { pattern: /\b(?:can someone|does anyone know|is there anyone)\b/i, weight: 10 },
];

/** Frases que restan: el post es discussion, no peticion. */
const NEGATIVE_SIGNALS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\b(?:news|discussion|daily|thread|official|announcement|rules|meta|weekly)\b/i, weight: 30 },
  { pattern: /\b(?:already (?:have|found|hired|used)|just (?:bought|got|finished))\b/i, weight: 25 },
  { pattern: /\b(?:memes|funny|pizza|sports|game|nba|anime)\b/i, weight: 20 },
  { pattern: /\b(?:should i|is it worth|which is better|vs\.?)\b/i, weight: 8 },
];

export function scoreLeadsHeuristic(
  business: BusinessProfile,
  leads: Lead[],
): Map<string, { matchScore: number; reason: string }> {
  const terms = new Set<string>();
  for (const keyword of business.keywords) {
    for (const word of keyword.toLowerCase().split(/[^a-z]+/)) {
      if (word.length > 3 && !STOPWORDS.has(word)) terms.add(word);
    }
  }
  for (const term of business.niche.toLowerCase().split(/[^a-z]+/)) {
    if (term.length > 3) terms.add(term);
  }
  for (const keyword of [...business.service, ...business.problems].join(" ").toLowerCase().split(/[^a-z]+/)) {
    if (keyword.length > 3 && !STOPWORDS.has(keyword)) terms.add(keyword);
  }

  const results = new Map<string, { matchScore: number; reason: string }>();

  for (const lead of leads) {
    const haystack = `${lead.title} ${lead.snippet} ${lead.community ?? ""}`.toLowerCase();

    let score = 32; // base: apareció en una búsqueda relacionada
    const hits: string[] = [];
    for (const term of terms) {
      if (haystack.includes(term)) {
        score += 6;
        if (hits.length < 3) hits.push(term);
      }
    }

    for (const { pattern, weight } of INTENT_SIGNALS) {
      if (pattern.test(haystack)) {
        score += weight;
        break; // solo la señal más fuerte de este grupo
      }
    }
    for (const { pattern, weight } of NEGATIVE_SIGNALS) {
      if (pattern.test(haystack)) {
        score -= weight;
        break;
      }
    }

    // Un post recién publicado es un lead más caliente.
    const ageDays = (Date.now() - new Date(lead.createdAt).getTime()) / 86_400_000;
    if (ageDays <= 2) score += 8;
    else if (ageDays > 180) score -= 10;

    const finalScore = Math.max(5, Math.min(99, Math.round(score)));

    const reason = buildReason(lead, hits, finalScore);
    results.set(lead.id, { matchScore: finalScore, reason });
  }

  return results;
}

function buildReason(lead: Lead, hits: string[], score: number): string {
  const where = lead.platform === "reddit" ? `r/${lead.community}` : "LinkedIn";
  const topic = hits.length ? ` sobre ${hits.slice(0, 2).join(" y ")}` : "";
  if (score >= 85) return `Pide explícitamente este servicio en ${where}${topic}. Está listo para contratar.`;
  if (score >= 70) return `Tiene el problema exacto que resuelves y busca soluciones en ${where}${topic}.`;
  if (score >= 45) return `Toca tu área en ${where}${topic}. Merece un mensaje de prueba.`;
  return `Relación débil con tu servicio en ${where}. Útil como contenido, poco probable que contrate.`;
}
