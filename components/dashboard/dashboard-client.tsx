"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Lead, Message } from "@/lib/types";
import type { MaskedLead } from "@/lib/mask";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { MessagePanel, type Quota } from "@/components/dashboard/message-panel";
import { IconLogout, IconSparkle, IconTarget } from "@/components/icons";

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

/**
 * Dashboard (SPEC.md, paso 6): leads desbloqueados, filtros, cuota de mensajes
 * y panel lateral para generar el mensaje de cada lead.
 */
export function DashboardClient({
  userEmail,
  mode,
  initialLeads,
  initialSearches,
  initialMessages,
  initialQuota,
}: {
  userEmail: string;
  mode: "supabase" | "local";
  initialLeads: Lead[];
  initialSearches: SearchSummary[];
  initialMessages: Message[];
  initialQuota: Quota;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searches] = useState(initialSearches);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [quota, setQuota] = useState<Quota>(initialQuota);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedSearch, setSelectedSearch] = useState<string>("all");

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
              <p className="text-[11px] text-ink-2">
                {mode === "supabase" ? "Sesión con Supabase" : "Sesión local (dev)"}
              </p>
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
                : "Analiza una web desde la portada para empezar."}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/#top" className="btn-accent">
              <IconSparkle className="h-4 w-4" />
              Analizar otra web
            </Link>
          </div>
        </div>

        {/* Cuota del plan gratis (SPEC.md, paso 8) */}
        <div className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Mensajes de IA esta semana</p>
            <p className="mt-0.5 text-xs text-ink-2">
              Leads y búsquedas ilimitados. Los mensajes de IA se renuevan cada lunes.
            </p>
          </div>
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
        </div>

        {/* Selector de búsqueda, si el usuario ha analizado varias webs */}
        {searches.length > 1 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSearch("all")}
              className={
                selectedSearch === "all"
                  ? "btn-accent !px-3.5 !py-1.5 !text-xs"
                  : "btn-ghost !px-3.5 !py-1.5 !text-xs"
              }
            >
              Todas
            </button>
            {searches.map((search) => (
              <button
                key={search.id}
                type="button"
                onClick={() => setSelectedSearch(search.id)}
                className={
                  selectedSearch === search.id
                    ? "btn-accent !px-3.5 !py-1.5 !text-xs"
                    : "btn-ghost !px-3.5 !py-1.5 !text-xs"
                }
              >
                {search.businessName} ({search.leadCount})
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          {leads.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="font-serif text-xl font-semibold">Sin leads todavía</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
                Vuelve a la portada, pega la URL de tu negocio y en segundos verás los leads
                desbloqueados en este panel.
              </p>
              <Link href="/#top" className="btn-accent mt-6">
                Buscar mis leads
              </Link>
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
