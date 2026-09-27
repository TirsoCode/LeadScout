/**
 * Utilidades compartidas por servidor y cliente.
 * No importar `fs` ni dependencias de Node en este fichero.
 */

export function slug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomId(prefix: string): string {
  const bytes = new Uint8Array(9);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (const b of bytes) out += b.toString(36).padStart(2, "0");
  return `${prefix}_${Date.now().toString(36)}${out.slice(0, 9)}`;
}

export type UrlValidation =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Valida lo que el usuario escribe en el input y devuelve un mensaje que se
 * pueda mostrar tal cual. Se usa en el cliente (feedback inmediato) y también
 * en el servidor, que nunca confía en lo que le manda el cliente.
 */
export function validateUrlInput(raw: string): UrlValidation {
  const value = raw.trim();

  if (!value) return { ok: false, error: "Escribe la URL de tu web para empezar." };

  if (/\s/.test(value)) {
    return { ok: false, error: "Una URL no puede contener espacios. Revísala." };
  }

  if (value.includes("@")) {
    return { ok: false, error: "Eso parece un email, no una web. Escribe algo como miweb.com" };
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { ok: false, error: "No es una URL válida. Ejemplo: miweb.com" };
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return { ok: false, error: "Solo admitimos URLs http o https." };
  }

  const host = parsed.hostname;

  if (host === "localhost" || !host.includes(".")) {
    return {
      ok: false,
      error: "Falta el dominio. Escribe la dirección completa, por ejemplo miweb.com",
    };
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(host)) {
    return { ok: false, error: `El dominio "${host}" no parece válido. Revísalo.` };
  }

  const tld = host.split(".").pop() ?? "";
  if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return {
      ok: false,
      error: `El dominio "${host}" no termina en una extensión válida (.com, .es, .io…).`,
    };
  }

  parsed.hash = "";
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|msclkid|ref|source|igshid)/i.test(key)) {
      parsed.searchParams.delete(key);
    }
  }

  return { ok: true, url: parsed.toString() };
}

/** Versión booleana de validateUrlInput, para el servidor. */
export function normalizeUrl(raw: string): string | null {
  const result = validateUrlInput(raw);
  return result.ok ? result.url : null;
}

/** Recorta texto a un maximo de caracteres sin cortar palabras a la mitad. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}

/** Primeras iniciales para el avatar: "Maria Lopez" -> "ML". */
export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Semana ISO-actual en formato YYYY-Www. Base del límite de 3 mensajes. */
export function currentIsoWeek(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
