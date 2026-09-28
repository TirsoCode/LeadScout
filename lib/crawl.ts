/**
 * Fetch + extracción de texto de la web que pega el usuario.
 * Sin dependencias externas: un strip de HTML con regex es más que suficiente
 * para extraer el texto que necesita el prompt, y así el bundle se mantiene
 * pequeño y el build no necesita nada nativo.
 */

import { truncate } from "./utils";

export type PageContent = {
  url: string;
  title: string;
  description: string;
  text: string;
  ok: boolean;
  error?: string;
};

const UA =
  "Mozilla/5.0 (compatible; LeadScoutBot/0.1; +https://leadscoutapp.vercel.app) AppleWebKit/537.36";

/** Bloquea IPs privadas/localhost para evitar SSRF hacia la red interna. */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host === "::1" || host.startsWith("[")) return false;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  if (a === 127 || a === 0) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function decodeEntities(input: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    "#39": "'",
    "#039": "'",
    "#x27": "'",
  };
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCharCode(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) return String.fromCharCode(parseInt(entity.slice(1), 10));
    return named[entity] ?? match;
  });
}

/** Quita scripts, estilos, etiquetas y colapsa espacios. */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|section|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t ]+/g, " ")
      .replace(/\n\s*\n\s*/g, "\n")
      .trim(),
  );
}

function extract(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match?.[1] ? decodeEntities(match[1].trim()) : "";
}

export async function fetchPage(rawUrl: string): Promise<PageContent> {
  const url = new URL(rawUrl);

  if (isPrivateHost(url.hostname)) {
    return {
      url: rawUrl,
      title: "",
      description: "",
      text: "",
      ok: false,
      error: "No se puede analizar una dirección local o privada.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en;q=0.9,*;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        url: res.url || rawUrl,
        title: "",
        description: "",
        text: "",
        ok: false,
        error: `El sitio respondió ${res.status}.`,
      };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return {
        url: res.url || rawUrl,
        title: "",
        description: "",
        text: "",
        ok: false,
        error: "Esa URL no es una página web (no es HTML).",
      };
    }

    const html = (await res.text()).slice(0, 1_500_000);
    const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description =
      extract(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      extract(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);

    const text = truncate(htmlToText(html), 6000);

    if (text.length < 120 && !title && !description) {
      return {
        url: res.url || rawUrl,
        title,
        description,
        text,
        ok: false,
        error: "La página no tiene texto legible. Prueba con la URL de tu homepage.",
      };
    }

    return { url: res.url || rawUrl, title, description, text, ok: true };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "El sitio tardó demasiado en responder."
        : "No se pudo acceder a esa web.";
    return { url: rawUrl, title: "", description: "", text: "", ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
