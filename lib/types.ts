// Modelo de datos de LeadScout. Ver SPEC.md / Instrucciones.md.

export type Platform = "reddit";

/** Perfil de negocio extraido de la web del usuario. */
export type BusinessProfile = {
  businessName: string;
  url: string;
  /** Que servicio o producto ofrece, en una frase. */
  service: string;
  /** A quien va dirigido. */
  audience: string;
  /** Keywords que describen a su cliente ideal. */
  keywords: string[];
  /** Problemas que resuelve el negocio. */
  problems: string[];
  /** Nicho vertical detectado ("diseño", "legal", "dev", ...). */
  niche: string;
  summary: string;
  /** Como se ha producido el analisis: "ai" o "heuristic". */
  source: "ai" | "heuristic";
};

/** Un lead encontrado en Reddit. */
export type Lead = {
  id: string;
  searchId: string;
  platform: Platform;
  /** Nombre visible de la persona. */
  name: string;
  /** Cargo / titulo, o titulo del post en Reddit. */
  title: string;
  /** @usuario o u/usuario en Reddit. */
  username: string;
  url: string;
  /** Comunidad donde aparece (solo Reddit). */
  community?: string;
  /** Texto que genera el lead (post, cuerpo, extracto). */
  snippet: string;
  /** Porcentaje de afinidad, 0-100. */
  matchScore: number;
  /** Explicacion en una frase de por que es un buen lead. */
  reason: string;
  createdAt: string;
  /** Fuente real de los datos: "reddit" o "demo" si no hay red. */
  origin: "reddit" | "demo";
};

/** Resultado completo de un scan: perfil + leads + estado de la IA. */
export type ScanResult = {
  searchId: string;
  business: BusinessProfile;
  leads: Lead[];
  /** true si los leads vienen de la API real de Reddit. */
  live: boolean;
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type Message = {
  id: string;
  userId: string;
  leadId: string;
  body: string;
  createdAt: string;
  editedAt?: string;
};

/**
 * De momento los mensajes de IA son ilimitados. `null` == sin tope semanal:
 * el servidor nunca bloquea la generación (antes eran 3/semana).
 */
export const FREE_WEEKLY_MESSAGE_LIMIT: number | null = null;

/** Cuántos leads se guardan por scan en la base de datos. */
export const MAX_LEADS_PER_SEARCH = 25;

/** Cuántos leads se devuelven al usuario final. */
export const LEADS_SHOWN = 12;
