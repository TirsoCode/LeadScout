"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiErrorResponse, isUnlockedLead } from "@/lib/api";
import type { MaskedLead } from "@/lib/mask";
import type { Lead, LeadSort, Message } from "@/lib/types";
import { LEAD_SORTS } from "@/lib/types";
import {
  clampExport,
  csvFilename,
  leadsToCsv,
  linkedinShareUrl,
  sortLeads,
} from "@/lib/leads";
import { copyText, downloadTextFile } from "@/lib/clipboard";
import { LeadRow } from "@/components/results/lead-row";
import { LeadStats } from "@/components/results/lead-stats";
import { MessagePanel, type Quota } from "@/components/dashboard/message-panel";
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconLinkedin,
  IconLock,
  IconShare,
  IconSort,
  IconStar,
  IconWhatsapp,
  IconXSocial,
} from "@/components/icons";

/**
 * La pantalla de resultados (paso 4 del flujo), en su propia ruta.
 *
 * Antes esto se pintaba dentro del hero de la landing. Ahora es `/resultados`:
 * la landing queda como página de entrada y esta es la pantalla de trabajo,
 * con espacio para el resumen, el orden, la exportación y las acciones.
 *
 * El enmascarado NO cambia: si no hay sesión, el servidor ya mandó
 * `MaskedLead` y aquí solo hay que respetar `locked`.
 */
export function ResultsScreen({
  business,
  leads: initialLeads,
  total,
  live,
  unlocked,
  quota,
  initialMessages,
  backHref,
}: {
  business: {
    businessName: string;
    url: string;
    service: string;
    audience: string;
    summary: string;
    keywords: string[];
    problems: string[];
  };
  leads: (MaskedLead | Lead)[];
  total: number;
  live: boolean;
  unlocked: boolean;
  quota: Quota;
  initialMessages: Message[];
  /** A dónde vuelve el enlace de "analizar otra web". */
  backHref: string;
}) {
  const [leads, setLeads] = useState<(MaskedLead | Lead)[]>(initialLeads);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [quotaState, setQuota] = useState<Quota>(quota);
  const [sort, setSort] = useState<LeadSort>("score");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingFavorite, setPendingFavorite] = useState<string | null>(null);

  const locked = !unlocked;

  const visible = useMemo(() => {
    const base = onlyFavorites
      ? leads.filter((lead): lead is Lead => isUnlockedLead(lead) && lead.favorite)
      : leads;
    return sortLeads(base as (MaskedLead | Lead)[], sort);
  }, [leads, onlyFavorites, sort]);

  const favorites = useMemo(
    () => leads.filter((lead): lead is Lead => isUnlockedLead(lead) && lead.favorite),
    [leads],
  );

  const messageFor = (leadId: string) => messages.find((message) => message.leadId === leadId);

  /** Cambio optimista: la estrella responde al instante y se revierte si el servidor dice que no. */
  async function toggleFavorite(lead: Lead, favorite: boolean) {
    setPendingFavorite(lead.id);
    setLeads((current) =>
      current.map((item) => (item.id === lead.id && isUnlockedLead(item) ? { ...item, favorite } : item)),
    );
    try {
      const { lead: updated } = await api.setFavorite(lead.id, favorite);
      setLeads((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id && isUnlockedLead(item) ? { ...item, favorite: !favorite } : item,
        ),
      );
      setNotice(
        err instanceof ApiErrorResponse ? err.message : "No se pudo guardar el favorito.",
      );
    } finally {
      setPendingFavorite(null);
    }
  }

  function handleExport() {
    const exportable = clampExport(visible.filter(isUnlockedLead));
    if (exportable.length === 0) return;
    const ok = downloadTextFile(csvFilename(business.businessName), leadsToCsv(exportable));
    setNotice(
      ok
        ? `Descargados ${exportable.length} leads en CSV.`
        : "No se pudo generar el CSV en este navegador.",
    );
  }

  async function handleCopyAll() {
    const text = visible
      .filter(isUnlockedLead)
      .map((lead) => `${lead.matchScore}% · r/${lead.community ?? "?"} · ${lead.name}\n${lead.url}`)
      .join("\n\n");
    if (!text) return;
    const ok = await copyText(text);
    setNotice(ok ? `Copiados ${visible.length} leads.` : "No se pudo copiar. Revisa los permisos del navegador.");
  }

  const shareLinks = favorites.length > 0 ? favorites : visible.filter(isUnlockedLead);

  return (
    <div className="animate-fade-up">
      {/* ---------------- Encabezado ---------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-accent"
          >
            <span aria-hidden="true">←</span> Analizar otra web
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {total} leads para <span className="text-accent">{business.businessName}</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
            {business.summary || business.service}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {business.keywords.slice(0, 5).map((keyword) => (
              <span key={keyword} className="badge border-line bg-bg/60 text-ink-2/90">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {!locked ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={handleExport} className="btn-ghost" disabled={visible.length === 0}>
              <IconDownload />
              Exportar CSV
            </button>
            <button type="button" onClick={handleCopyAll} className="btn-ghost" disabled={visible.length === 0}>
              <IconCopy />
              Copiar
            </button>
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="mt-4 flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
          <IconCheck className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      ) : null}

      {/* ---------------- Resumen ---------------- */}
      <div className="mt-6">
        <LeadStats leads={leads} />
      </div>

      {/* ---------------- Herramientas de la lista ---------------- */}
      <div className="card mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">Tus leads</h2>
          <span className="text-xs text-ink-2/70">
            {visible.length} de {leads.length}
          </span>
          {favorites.length > 0 ? (
            <span className="badge border-accent/30 bg-accent/10 text-accent">
              <IconStar className="h-3 w-3" filled />
              {favorites.length} favoritos
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!locked ? (
            <button
              type="button"
              onClick={() => setOnlyFavorites((value) => !value)}
              aria-pressed={onlyFavorites}
              className={`btn-ghost !px-3 !py-2 !text-xs ${onlyFavorites ? "!border-accent !text-accent" : ""}`}
              disabled={favorites.length === 0}
            >
              <IconStar className="h-3.5 w-3.5" filled={onlyFavorites} />
              Solo favoritos
            </button>
          ) : null}

          <label className="sr-only" htmlFor="lead-sort">
            Ordenar leads
          </label>
          <div className="relative">
            <IconSort className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-2/60" />
            <select
              id="lead-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as LeadSort)}
              className="input !w-auto !py-2 !pl-8 !text-xs"
            >
              {LEAD_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ---------------- Compartir la tanda ---------------- */}
      {!locked && shareLinks.length > 0 ? (
        <ShareBar leads={shareLinks.slice(0, 5)} businessName={business.businessName} />
      ) : null}

      {/* ---------------- Lista ---------------- */}
      <div className="card relative mt-4 overflow-hidden">
        <ul>
          {visible.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              locked={locked}
              onGenerate={(item) => setActiveLead(item)}
              onToggleFavorite={toggleFavorite}
              pendingFavoriteId={pendingFavorite}
              detailHref={isUnlockedLead(lead) ? `/lead/${lead.id}` : undefined}
            />
          ))}
        </ul>

        {visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-2">
            {onlyFavorites
              ? "No tienes favoritos todavía. Marca alguno con la estrella."
              : "Ningún lead cumple estos filtros."}
          </p>
        ) : null}

        {locked ? <LockedPanel total={total} /> : null}
      </div>

      {activeLead ? (
        <MessagePanel
          lead={activeLead}
          quota={quotaState}
          existing={messageFor(activeLead.id)}
          onClose={() => setActiveLead(null)}
          onQuota={setQuota}
          onSaved={(message) =>
            setMessages((current) => [message, ...current.filter((item) => item.id !== message.id)])
          }
        />
      ) : null}
    </div>
  );
}

/** Botones para mandar la tanda de leads a WhatsApp, X o LinkedIn. */
function ShareBar({ leads, businessName }: { leads: Lead[]; businessName: string }) {
  const text = encodeURIComponent(
    `${leads.length} leads para ${businessName} encontrados con LeadScout`,
  );
  const first = leads[0];

  return (
    <div className="card mt-4 flex flex-wrap items-center gap-3 p-4">
      <IconShare className="h-4 w-4 text-ink-2" />
      <span className="text-sm text-ink-2">¿Compartir la tanda con tu equipo?</span>
      <div className="ml-auto flex items-center gap-1.5">
        <SocialLink
          href={`https://wa.me/?text=${text}`}
          label="Compartir por WhatsApp"
          className="hover:bg-[#25D366]/10"
        >
          <IconWhatsapp className="h-5 w-5 text-[#25D366]" />
        </SocialLink>
        <SocialLink
          href={`https://twitter.com/intent/tweet?text=${text}`}
          label="Compartir en X"
          className="hover:bg-ink/5"
        >
          <IconXSocial className="h-5 w-5 text-ink" />
        </SocialLink>
        <SocialLink
          href={linkedinShareUrl(first)}
          label="Compartir el mejor lead en LinkedIn"
          className="hover:bg-[#0A66C2]/10"
        >
          <IconLinkedin className="h-5 w-5 text-[#0A66C2]" />
        </SocialLink>
      </div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line transition-colors ${className ?? ""}`}
    >
      {children}
    </a>
  );
}

/** El velo de bloqueo del anónimo: los datos ya vienen recortados del servidor. */
function LockedPanel({ total }: { total: number }) {
  return (
    <div className="relative mt-2 overflow-hidden rounded-b-xl">
      <div className="locked-veil absolute inset-x-0 bottom-0 top-8" aria-hidden="true" />
      <div className="relative px-5 pb-12 pt-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white">
          <IconLock className="h-5 w-5 text-accent" />
        </div>
        <p className="mt-4 font-serif text-xl font-semibold">
          Hay {total} leads aquí esperando
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">
          Crea tu cuenta gratis para ver nombres, perfiles, el motivo de cada match y generar un
          mensaje personalizado para cada uno.
        </p>
      </div>
    </div>
  );
}
