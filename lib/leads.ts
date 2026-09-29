/**
 * Utilidades de la LISTA de leads: ordenar, resumir y exportar.
 *
 * Viven aquí y no en un componente porque las usan dos sitios —la pantalla de
 * resultados y el dashboard— y porque son funciones puras: se pueden probar y
 * razonar sin montar nada.
 *
 * Todo lo que sale de aquí con un `MaskedLead` (preview anónima) se limita a
 * los campos que el servidor ya dejó en claro: `matchScore`, `community`,
 * `platform` y `createdAt`. Nada de nombre ni url.
 */

import { SCORE_TIERS, type LeadSort, type Lead } from "./types";
import type { MaskedLead } from "./mask";
import { relativeTime } from "./utils";

/** Lo mínimo que necesitan estas funciones de cualquier lead, esté o no completo. */
export type SortableLead = Pick<Lead, "matchScore" | "createdAt"> &
  Partial<Pick<Lead, "name" | "community">>;

/**
 * Ordena sin mutar el array original (`toSorted` cuando existe, `slice` si
 * no): el estado de React depende de que la referencia no cambie para no
 * re-renderizar de más.
 */
export function sortLeads<T extends SortableLead>(leads: T[], sort: LeadSort): T[] {
  const copy = leads.slice();
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "community":
      return copy.sort(
        (a, b) =>
          (a.community ?? "zzz").localeCompare(b.community ?? "zzz") ||
          b.matchScore - a.matchScore,
      );
    case "name":
      return copy.sort(
        (a, b) =>
          (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" }) ||
          b.matchScore - a.matchScore,
      );
    case "score":
    default:
      return copy.sort((a, b) => b.matchScore - a.matchScore);
  }
}

/** Un tramo de afinidad con su etiqueta y sus leads. */
export type ScoreBucket = {
  key: string;
  label: string;
  hint: string;
  min: number;
  leads: (MaskedLead | Lead)[];
};

/**
 * Reparte los leads en los tres tramos de SCORE_TIERS. Un lead cae en el
 * tramo más alto que cumple, así que los tramos no se pisan entre sí y la
 * suma de `count` siempre es el total.
 */
export function bucketByScore(leads: (MaskedLead | Lead)[]): ScoreBucket[] {
  return SCORE_TIERS.map((tier) => ({
    key: `${tier.min}`,
    ...tier,
    leads: leads.filter((lead) => lead.matchScore >= tier.min),
  }));
}

export type LeadSummary = {
  total: number;
  average: number;
  best: number;
  hot: number;
  fresh: number;
  communities: { name: string; count: number }[];
  buckets: ScoreBucket[];
};

/**
 * El resumen que se pinta encima de la lista. Solo usa `matchScore`,
 * `community` y `createdAt`, así que funciona igual con leads enmascarados
 * (el anónimo ve el reparto pero no los nombres).
 */
export function summarizeLeads(leads: (MaskedLead | Lead)[]): LeadSummary {
  const total = leads.length;
  const sum = leads.reduce((acc, lead) => acc + lead.matchScore, 0);

  const counts = new Map<string, number>();
  for (const lead of leads) {
    const name = lead.community;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return {
    total,
    average: total > 0 ? Math.round(sum / total) : 0,
    best: leads.reduce((max, lead) => Math.max(max, lead.matchScore), 0),
    hot: leads.filter((lead) => lead.matchScore >= 85).length,
    // "Reciente" = menos de una semana: es el margen en el que la persona
    // todavía está buscando proveedor, no Responding "ya lo tengo".
    fresh: leads.filter((lead) => {
      const days = (Date.now() - new Date(lead.createdAt).getTime()) / 86_400_000;
      return Number.isFinite(days) && days <= 7;
    }).length,
    communities: [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    buckets: bucketByScore(leads),
  };
}

// --- exportación a CSV -------------------------------------------------------

/**
 * Escapa un valor de CSV. Además de las comillas y el salto de línea, neutraliza
 * los prefijos que Excel/Sheets interpretan como fórmula (=, +, -, @): sin esto,
 * un post de Reddit que empiece por "=SUM(...)" se ejecutaría al abrir el CSV.
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

const CSV_COLUMNS: { header: string; value: (lead: Lead) => string }[] = [
  { header: "Nombre", value: (lead) => lead.name || lead.username },
  { header: "Usuario", value: (lead) => lead.username },
  { header: "Titulo", value: (lead) => lead.title },
  { header: "Comunidad", value: (lead) => lead.community ?? "" },
  { header: "Afinidad %", value: (lead) => String(lead.matchScore) },
  { header: "Motivo", value: (lead) => lead.reason },
  { header: "Post", value: (lead) => lead.snippet },
  { header: "URL", value: (lead) => lead.url },
  { header: "Publicado", value: (lead) => relativeTime(lead.createdAt) },
  { header: "Favorito", value: (lead) => (lead.favorite ? "si" : "no") },
];

const CSV_SEPARATOR = ";";

/**
 * Construye el CSV de una lista de leads. Separador `;` porque el audience es
 * español y en el Excel de la config regional europea la coma es separador de
 * decimales: con `,` las columnas se rompen al abrir el fichero.
 */
export function leadsToCsv(leads: Lead[]): string {
  const header = CSV_COLUMNS.map((column) => csvCell(column.header)).join(CSV_SEPARATOR);
  const rows = leads.map((lead) =>
    CSV_COLUMNS.map((column) => csvCell(column.value(lead) ?? "")).join(CSV_SEPARATOR),
  );
  // BOM: sin él Excel abre los acentos y la ñ como caracteres raros.
  return `﻿${[header, ...rows].join("\r\n")}\r\n`;
}

/** Nombre de fichero seguro a partir del negocio, para la descarga. */
export function csvFilename(businessName: string): string {
  const base =
    businessName
      .toLowerCase()
      .normalize("NFD")
      // Quita los diacríticos combinantes (U+0300–U+036F) que deja NFD, para
      // que "Diseño" acabe en "diseno" y el nombre sea un path válido.
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "leads";
  const stamp = new Date().toISOString().slice(0, 10);
  return `leadscout-${base}-${stamp}.csv`;
}

// --- compartir ---------------------------------------------------------------

/** Resumen en texto plano del lead, para pegar en un chat o en un DM. */
export function leadToText(lead: Lead): string {
  return [
    `${lead.name || lead.username} — ${lead.matchScore}% de afinidad`,
    lead.title,
    lead.url,
  ].join("\n");
}

const SHARE_LIMIT = 1800;

/** Recorta el texto al límite de las URLs de compartir sin partir el mensaje. */
function shareText(text: string): string {
  return text.length <= SHARE_LIMIT ? text : `${text.slice(0, SHARE_LIMIT - 1)}…`;
}

export function whatsappShareUrl(lead: Lead): string {
  return `https://wa.me/?text=${encodeURIComponent(shareText(leadToText(lead)))}`;
}

export function twitterShareUrl(lead: Lead): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText(`${leadToText(lead)}\n\nEn LeadScout`),
  )}`;
}

export function linkedinShareUrl(lead: Lead): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    lead.url,
  )}`;
}

/** Techo de la exportación, para no generar un CSV de 50 MB en el navegador. */
export const MAX_EXPORT_LEADS = 500;

export function clampExport<T>(leads: T[]): T[] {
  return leads.slice(0, MAX_EXPORT_LEADS);
}
