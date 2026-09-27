/**
 * Tipos de respuesta de la API + helpers de fetch para el cliente.
 * Es el contrato compartido entre los route handlers y los componentes.
 */

import type { BusinessProfile, Lead, Message, User } from "./types";
import type { MaskedLead } from "./mask";

export type ScanResponse = {
  searchId: string;
  business: BusinessProfile;
  /** Leads enmascarados si `unlocked` es false; completos si es true. */
  leads: (MaskedLead | Lead)[];
  live: boolean;
  unlocked: boolean;
  total: number;
  createdAt: string;
};

export type SessionResponse = {
  user: User | null;
  mode: "supabase" | "local";
  quota?: { used: number; limit: number; remaining: number };
};

export type GenerateMessageResponse = {
  message: Message;
  source: "ai" | "template";
  quota: { used: number; limit: number; remaining: number };
};

export type ApiError = {
  error: string;
  code?: string;
  resetDate?: string;
  quota?: { used: number; limit: number; remaining: number };
};

/** Error de API con el mensaje ya listo para pintar y el status HTTP. */
export class ApiErrorResponse extends Error {
  status: number;
  payload: ApiError;
  constructor(status: number, payload: ApiError) {
    super(payload.error);
    this.name = "ApiErrorResponse";
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const error =
      (payload as ApiError | null)?.error ??
      (res.status === 429 ? "Demasiadas peticiones. Espera un momento." : "Algo ha fallado.");
    throw new ApiErrorResponse(res.status, { ...(payload as ApiError), error });
  }

  return payload as T;
}

export const api = {
  scan: (url: string) => request<ScanResponse>("/api/scan", { method: "POST", body: JSON.stringify({ url }) }),

  session: () => request<SessionResponse>("/api/auth/session"),

  auth: (mode: "signup" | "login", email: string, password: string) =>
    request<{ user: User }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ mode, email, password }),
    }),

  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  generateMessage: (leadId: string) =>
    request<GenerateMessageResponse>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ leadId }),
    }),

  saveMessage: (id: string, text: string) =>
    request<{ message: Message }>("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ id, text }),
    }),

  messages: () => request<{ messages: Message[] }>("/api/messages"),
};

/** ¿Es este lead un MaskedLead (preview) o un Lead completo? */
export function isUnlockedLead(lead: MaskedLead | Lead): lead is Lead {
  return "url" in lead && typeof lead.url === "string";
}
