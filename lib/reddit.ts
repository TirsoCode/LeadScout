/**
 * Cliente de la API pública de Reddit.
 *
 * `https://www.reddit.com/search.json` es público y no necesita credenciales.
 * Si se configuran REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET se usa el flujo
 * OAuth de "script app" (solo lectura) para subir el rate limit.
 *
 * Si la petición falla (red bloqueada, rate limit, JSON no-JSON...) devolvemos
 * `null` y el orquestador genera leads de demostración coherentes con el nicho,
 * de forma que el flujo de producto se puede demostrar siempre.
 */

import type { BusinessProfile, Lead } from "./types";
import { LEADS_SHOWN } from "./types";
import { randomId, truncate } from "./utils";

const SEARCH_URL = "https://www.reddit.com/search.json";
const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const UA = process.env.REDDIT_USER_AGENT || "LeadScout/0.1 (by /u/leadscout)";

type RedditChild = {
  kind?: string;
  data?: {
    id?: string;
    title?: string;
    selftext?: string;
    body?: string;
    author?: string;
    permalink?: string;
    subreddit?: string;
    subreddit_name_prefixed?: string;
    created_utc?: number;
    permalink_url?: string;
  };
};

async function getToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

/** Busca posts en Reddit y los normaliza a nuestro tipo Lead. */
export async function searchReddit(
  query: string,
  searchId: string,
  limit = LEADS_SHOWN,
): Promise<Lead[] | null> {
  const token = await getToken();
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(limit * 2, 50)));
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("t", "year");
  url.searchParams.set("type", "link");
  url.searchParams.set("raw_json", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: { children?: RedditChild[] };
    };
    const children = json.data?.children ?? [];

    const leads: Lead[] = [];
    for (const child of children) {
      const d = child.data;
      if (!d?.title || !d.author || d.author === "[deleted]" || d.author === "AutoModerator") continue;

      const community = (d.subreddit_name_prefixed || d.subreddit || "").replace(/^\/?r\//, "");
      if (!community) continue;

      const body = (d.selftext || d.body || "").replace(/\s+/g, " ").trim();
      const permalink = d.permalink || `/${community}/comments/${d.id}`;

      leads.push({
        id: randomId("lead"),
        searchId,
        platform: "reddit",
        name: `u/${d.author}`,
        title: d.title,
        username: d.author,
        url: `https://www.reddit.com${permalink}`,
        community,
        snippet: body || d.title,
        matchScore: 0,
        reason: "",
        createdAt: new Date((d.created_utc ?? 0) * 1000).toISOString(),
        origin: "reddit",
        favorite: false,
      });
      if (leads.length >= limit) break;
    }

    return leads.length > 0 ? leads : null;
  } catch (err) {
    console.error("[reddit] search falló:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Construye las queries de búsqueda a partir del perfil de negocio.
 * Reddit está en inglés, por eso el analizador devuelve keywords en inglés.
 */
export function buildQueries(business: BusinessProfile): string[] {
  const fromKeywords = business.keywords.slice(0, 4).map((keyword) => keyword.trim());
  const fromNiche = business.niche
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z]/gi, ""))
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => `need a ${word} (self:${word})`);

  const seen = new Set<string>();
  return [...fromKeywords, ...fromNiche]
    .map((query) => query.replace(/["()]/g, " ").replace(/\s+/g, " ").trim())
    .filter((query) => {
      const key = query.toLowerCase();
      if (key.length < 4 || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

/** Nombres de usuario plausibles para los leads de demostración. */
const DEMO_HANDLES = [
  "smallbizowner", "mark_and_co", "growingstartup", "thehungryagency", "craftsbylena",
  "digitalnomadhq", "brickandmortar", "foundermike", "studioowner", "launchweekend",
  "quietlybuilding", "pandemicpivot", "thirtydayproject", "momsinthebiz", "solo_founder",
  "ecom_and_co", "localfirstbiz", "chronicecommerce", "the_hustle_daily", "buildinpublic",
];

const DEMO_COMMUNITIES: Record<string, string[]> = {
  branding: ["r/Entrepreneur", "r/smallbusiness", "r/Branding", "r/graphic_design"],
  "web design": ["r/web_design", "r/Entrepreneur", "r/smallbusiness", "r/Squarespace"],
  software: ["r/forhire", "r/startups", "r/webdev", "r/SideProject"],
  copywriting: ["r/copywriting", "r/marketing", "r/Entrepreneur", "r/freelance"],
  marketing: ["r/Entrepreneur", "r/SEO", "r/marketing", "r/smallbusiness"],
  legal: ["r/LegalAdvice", "r/insolpersonaladvice", "r/LawFirm"],
  health: ["r/dentistry", "r/Health", "r/medical"],
  "real estate": ["r/realestate", "r/apartmentliving", "r/FirstTimeHomeBuyer"],
  ecommerce: ["r/ecommerce", "r/shopify", "r/Entrepreneur", "r/printandsell"],
  design: ["r/graphic_design", "r/Entrepreneur", "r/Design", "r/smallbusiness"],
  translation: ["r/translation", "r/translators", "r/localization"],
  video: ["r/VideoEditing", "r/videography", "r/filmmakers"],
  consulting: ["r/Business", "r/Entrepreneur", "r/consulting"],
  "social media": ["r/Entrepreneur", "r/marketing", "r/socialmedia"],
  general: ["r/Entrepreneur", "r/smallbusiness", "r/sidehustle", "r/marketing"],
};

const DEMO_INTENTS: Record<string, string[]> = {
  branding: [
    "My logo is 6 years old and looks really amateur. Does anyone know a good designer who could redo the whole identity? Budget around $800.",
    "We are launching a coffee brand in March and need a logo plus packaging design. Who should I talk to?",
    "Looking for a branding agency that actually understands small food businesses, not just tech startups.",
  ],
  "web design": [
    "My website was built in WordPress in 2015 and it looks ancient. Anyone know a freelancer who can rebuild it properly?",
    "Looking for someone to build a small site for my dental practice. 5 pages, booking form, nothing crazy.",
    "Our site is slow and totally not mobile friendly. How much would a redesign cost roughly?",
  ],
  software: [
    "I have an idea for a small SaaS but no technical skills. Where do real people start? Looking for a developer to talk to.",
    "Need someone to fix an API integration that has been broken for weeks. Our freelancer ghosted us.",
    "Hiring a part time React developer for a dashboard project. Roughly 20 hours a week, 3 months.",
  ],
  copywriting: [
    "My website copy is terrible and nobody converts. Anyone know a copywriter who rewrites landing pages?",
    "Looking for a ghostwriter for 4 blog posts a month about personal finance. Paid, not looking for exposure.",
    "I write my own copy and it sounds like a robot. Need someone to make it sound human.",
  ],
  marketing: [
    "We are spending $2k a month on Google Ads and getting nothing. Where do I even start?",
    "Looking for an SEO expert. My site does not appear anywhere in Google for the main service we sell.",
    "Need help with a launch campaign for a new product in 6 weeks. Budget is real but limited.",
  ],
  legal: [
    "My landlord is threatening to evict me with what I think is an illegal notice. What are my options?",
    "I signed a contract I do not understand and I think I was ripped off. Anyone know a good lawyer?",
    "Small business here. Need a lawyer for an employment dispute with a former contractor.",
  ],
  health: [
    "Looking for a dentist that does implants. Mine retired and I have no idea where to start.",
    "I have had the same symptom for 3 weeks and my doctor brushed it off. Second opinion?",
    "Does anyone know a good clinic that takes walk ins in this area?",
  ],
  "real estate": [
    "First time buyer, pre approved, looking in the east side. Which neighbourhoods should I look at for a 2 bed?",
    "Our landlord raised the rent 30%. What are my rights as a tenant?",
    "Looking for an agent to sell a house I inherited. Any recommendations?",
  ],
  ecommerce: [
    "My Shopify store gets traffic but nobody buys. Looking for someone to audit the whole funnel.",
    "Need help migrating from WooCommerce to Shopify with about 800 products. Worth it?",
    "Payments keep failing on my store for European customers. What is going on?",
  ],
  design: [
    "I need about 30 illustrations for a blog series and the quotes I have are crazy high.",
    "Looking for a graphic designer for social media templates, 3 posts a week.",
    "Our startup deck looks amateur. Anyone willing to redo it properly?",
  ],
  translation: [
    "We are expanding to Japan next year and need our whole site translated. What is realistic in terms of cost?",
    "Looking for a translator for technical documentation, about 80 pages, English to German.",
    "Our app has bad Spanish. Need a native speaker to review the copy before we launch.",
  ],
  video: [
    "Looking for a video editor for YouTube, 2 long form videos a month. Where do I start?",
    "Need someone to shoot a short brand video for our new product launch in Berlin.",
    "My footage is on an old camera and the audio is terrible. Can someone fix it?",
  ],
  consulting: [
    "We have been running this company 5 years and I do not know what the next step should be. Anyone recommend a consultant?",
    "Need someone to review our pricing strategy, we are leaving money on the table.",
    "Looking for help structuring a pitch deck for a seed round.",
  ],
  "social media": [
    "I post every day and get almost no engagement. What am I doing wrong?",
    "Need a social media manager for a restaurant, 3 posts a week plus stories.",
    "My Instagram was taken over by an old manager. How do I take it back?",
  ],
  general: [
    "I run a small business and I am completely overwhelmed. Where do I even start?",
    "Looking for recommendations for someone reliable to help me with this.",
    "Anyone out there actually solved this problem? Tell me what worked for you.",
  ],
};

/**
 * Genera leads de demostración deterministas a partir del perfil de negocio.
 * Se usan solo cuando Reddit no responde, para que la demo del producto
 * siga siendo posible sin red. Mismo negocio -> mismos leads.
 */
export function demoLeads(business: BusinessProfile, searchId: string): Lead[] {
  const key = business.niche in DEMO_COMMUNITIES ? business.niche : "general";
  const communities = DEMO_COMMUNITIES[key] ?? DEMO_COMMUNITIES.general;
  const intents = DEMO_INTENTS[key] ?? DEMO_INTENTS.general;

  // Semilla determinista: mismo negocio + misma búsqueda => mismos leads.
  const seed = [...`${business.businessName}${searchId}`].reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 100_000,
    7,
  );
  const pick = (arr: string[], offset: number) => arr[(seed + offset * 13) % arr.length];

  const leads: Lead[] = [];
  for (let i = 0; i < 9; i++) {
    const handle = pick(DEMO_HANDLES, i);
    const community = communities[i % communities.length].replace(/^r\//, "");
    const daysAgo = (seed + i * 7) % 90;
    const shortId = (seed * (i + 3)).toString(36).slice(0, 7);

    leads.push({
      id: randomId("lead"),
      searchId,
      platform: "reddit",
      name: `u/${handle}`,
      title: truncate(intents[i % intents.length], 110),
      username: handle,
      url: `https://www.reddit.com/r/${community}/comments/${shortId}/`,
      community,
      snippet: truncate(intents[i % intents.length], 320),
      matchScore: 0,
      reason: "",
      createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      origin: "demo",
      favorite: false,
    });
  }
  return leads;
}
