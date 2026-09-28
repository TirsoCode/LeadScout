"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiErrorResponse, isUnlockedLead } from "@/lib/api";
import type { Lead, Message } from "@/lib/types";
import type { MaskedLead } from "@/lib/mask";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { MessagePanel, type Quota } from "@/components/dashboard/message-panel";
import { SearchBox, type ScannedResult } from "@/components/dashboard/search-box";
import { SearchHistory } from "@/components/dashboard/search-history";
import { BulkCopyButton } from "@/components/dashboard/bulk-actions";
import { IconCheck, IconLogout, IconTarget } from "@/components/icons";

export type SearchSummary = {
  id: string;
  url: string;
  live: boolean;
  createdAt: string;
  businessName: string;
  service: string;
  leadCount: number;
  topScore: number;
};

/** Clave de deduplicación de un lead: la URL del post o título+comunidad. */
function leadKey(lead: Lead): string {
  return lead.url ? lead.url.split("?")[0] : `${lead.title}|${lead.community ?? ""}`;
}

/**
 * Dashboard (SPEC.md, paso 6): leads desbloqueados, filtros, cuota de mensajes
 * y panel lateral para generar el mensaje de cada lead. Además:
 * - nueva búsqueda sin salir del panel,
 * - "buscar más leads" por web analizada (re-scan con dedup),
 * - historial de búsquedas,
 * - copiar todos los mensajes de golpe.
 */
export function DashboardClient({
  userEmail,
  initialLeads,
  initialSearches,
  initialMessages,
  initialQuota,
}: {
  userEmail: string;
  initialLeads: Lead[];
  initialSearches: SearchSummary[];
  initialMessages: Message[];
  initialQuota: Quota;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searches, setSearches] = useState<SearchSummary[]>(initialSearches);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [quota, setQuota] = useState<Quota>(initialQuota);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedSearch, setSelectedSearch] = useState<string>("all");
  const [findMoreId, setFindMoreId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(
    () => (selectedSearch === "all" ? leads : leads.filter((lead) => lead.searchId === selectedSearch)),
    [leads, selectedSearch],
  );

  const messageFor = (leadId: string) => messages.find((message) => message.leadId === leadId);

  async function handleLogout() {
    await api.logout().catch(() => undefined);
    router.refresh();
    router.push("/");
  }

  /** Nueva búsqueda desde el panel: mezcla los leads y crea su entrada en el historial. */
  function handleScanned(result: ScannedResult) {
    setNotice(null);

    const incoming = result.leads
      .filter(isUnlockedLead)
      .map((lead) => ({ ...lead, searchId: result.searchId }));
    const seen = new Set(leads.map(leadKey));
    const fresh = incoming.filter((lead) => !seen.has(leadKey(lead)));

    const summary: SearchSummary = {
      id: result.searchId,
      url: result.business.url,
      live: result.live,
      createdAt: result.createdAt,
      businessName: result.business.businessName,
      service: result.business.service,
      leadCount: result.leads.length,
      topScore: result.leads.reduce((max, lead) => Math.max(max, lead.matchScore), 0),
    };

    setLeads((current) => {
      const seenCurrent = new Set(current.map(leadKey));
      return [...fresh.filter((lead) => !seenCurrent.has(leadKey(lead))), ...current];
    });
    setSearches((current) => [summary, ...current.filter((search) => search.id !== summary.id)]);
    setSelectedSearch(result.searchId);

    if (fresh.length === 0) {
      setNotice(`Ya tenías esos leads de ${result.business.businessName}. Se añadió al historial.`);
    }
  }

  /** "Buscar más leads" sobre una web ya analizada: re-scan + dedup contra sus leads. */
  async function handleFindMore(search: SearchSummary) {
    if (findMoreId === search.id) return;

    setFindMoreId(search.id);
    setNotice(null);

    try {
      const result = await api.scan(search.url);
      const incoming = result.leads
        .filter(isUnlockedLead)
        .map((lead) => ({ ...lead, searchId: search.id }));
      const existing = new Set(leads.filter((lead) => lead.searchId === search.id).map(leadKey));
      const fresh = incoming.filter((lead) => !existing.has(leadKey(lead)));

      if (fresh.length === 0) {
        setNotice(`No hay leads nuevos para ${search.businessName}. Prueba otra vez más tarde.`);
      } else {
        setLeads((current) => {
          const seenCurrent = new Set(current.map(leadKey));
          return [...fresh.filter((lead) => !seenCurrent.has(leadKey(lead))), ...current];
        });
        setSearches((current) =>
          current.map((item) =>
            item.id === search.id
              ? {
                  ...item,
                  leadCount: item.leadCount + fresh.length,
                  topScore: Math.max(item.topScore, ...fresh.map((lead) => lead.matchScore)),
                }
              : item,
          ),
        );
        setSelectedSearch(search.id);
        setNotice(
          `Encontrados ${fresh.length} lead${fresh.length === 1 ? "" : "s"} nuevo${fresh.length === 1 ? "" : "s"} para ${search.businessName}.`,
        );
      }
    } catch (err) {
      setNotice(
        err instanceof ApiErrorResponse ? err.message : "No se pudo buscar más leads.",
      );
    } finally {
      setFindMoreId(null);
    }
  }

  /** Copia masiva: el cliente del botón actualiza mensajes y cuota con cada generación. */
  function handleMessageGenerated(message: Message, nextQuota: Quota) {
    setMessages((current) => [message, ...current.filter((item) => item.id !== message.id)]);
    setQuota(nextQuota);
  }

  const bestScore = leads.reduce((max, lead) => Math.max(max, lead.matchScore), 0);
  const hotLeads = leads.filter((lead) => lead.matchScore >= 85).length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-serif text-xl font-semibold tracking-tight">LeadScout</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[180px] truncate text-xs font-medium">{userEmail}</p>
              <p className="text-[11px] text-ink-2">Sesión activa</p>
            </div>
            <button type="button" onClick={handleLogout} className="btn-ghost !px-3.5 !py-2 !text-xs">
              <IconLogout />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        {/* Resumen */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="badge border-accent/30 bg-accent/10 text-accent">
              <IconTarget className="h-3.5 w-3.5" />
              Tus leads desbloqueados
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {leads.length > 0 ? `${leads.length} leads listos para contactar` : "Aún no tienes leads"}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              {leads.length > 0
                ? `${hotLeads} por encima del 85% de afinidad · mejor match ${bestScore}%`
                : "Pega la URL de tu negocio aquí abajo para empezar."}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <BulkCopyButton
              leads={visible}
              messages={messages}
              onGenerated={handleMessageGenerated}
            />
          </div>
        </div>

        {/* Aviso de las acciones (nueva búsqueda / buscar más) */}
        {notice ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
            <IconCheck className="h-4 w-4 shrink-0" />
            {notice}
          </p>
        ) : null}

        {/* Nueva búsqueda sin salir del panel */}
        <SearchBox onScanned={handleScanned} />

        {/* Cuota de mensajes (de momento ilimitados) */}
        <div className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Mensajes de IA esta semana</p>
            <p className="mt-0.5 text-xs text-ink-2">
              {quota.limit === null
                ? "Ilimitados por ahora. Genera todos los que necesites."
                : "Leads y búsquedas ilimitados. Los mensajes de IA se renuevan cada lunes."}
            </p>
          </div>
          {quota.limit === null ? (
            <span className="badge border-accent/30 bg-accent/10 text-accent">Sin límite</span>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: quota.limit }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-8 rounded-full ${
                      index < quota.used ? "bg-accent" : "bg-line"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm tabular-nums text-ink-2">
                {quota.used}/{quota.limit}
              </span>
            </div>
          )}
        </div>

        {/* Historial de búsquedas */}
        <SearchHistory
          searches={searches}
          selected={selectedSearch}
          onSelect={setSelectedSearch}
          findMoreId={findMoreId}
          onFindMore={handleFindMore}
        />

        <div className="mt-6">
          {leads.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="font-serif text-xl font-semibold">Sin leads todavía</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
                Pega la URL de tu negocio en el buscador de arriba y en segundos verás los leads
                desbloqueados en este panel.
              </p>
            </div>
          ) : (
            <LeadsTable
              leads={visible as (Lead | MaskedLead)[]}
              onGenerate={(lead) => {
                setGeneratingId(lead.id);
                setActiveLead(lead);
                setGeneratingId(null);
              }}
              generatingId={generatingId}
            />
          )}
        </div>
      </main>

      {activeLead ? (
        <MessagePanel
          lead={activeLead}
          quota={quota}
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