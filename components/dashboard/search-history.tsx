"use client";

import { useState } from "react";
import Link from "next/link";
import type { SearchSummary } from "./dashboard-client";
import { IconExternal, IconEye, IconRefresh, IconSpinner } from "@/components/icons";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Historial de búsquedas del usuario: cada web analizada con su fecha, nº de
 * leads y badge live/demo, más acciones para verla o buscar más leads.
 */
export function SearchHistory({
  searches,
  selected,
  onSelect,
  findMoreId,
  onFindMore,
}: {
  searches: SearchSummary[];
  selected: string;
  onSelect: (id: string) => void;
  findMoreId: string | null;
  onFindMore: (search: SearchSummary) => void;
}) {
  const [open, setOpen] = useState(true);

  if (searches.length === 0) return null;

  const totalLeads = searches.reduce((sum, search) => sum + search.leadCount, 0);

  return (
    <section className="card mt-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="flex items-center gap-2.5">
          <IconEye className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">Historial de búsquedas</span>
          <span className="badge border-line bg-bg/60 text-ink-2">
            {searches.length} {searches.length === 1 ? "web" : "webs"}
          </span>
        </span>
        <span className="text-xs text-ink-2/70">{open ? "Ocultar" : "Ver"}</span>
      </button>

      {open ? (
        <div className="border-t border-line/70">
          <ul>
            {/* Filtro "todas": resume todas las búsquedas */}
            <li className="border-b border-line/60 p-4 last:border-b-0 sm:px-5">
              <button
                type="button"
                onClick={() => onSelect("all")}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selected === "all" ? "bg-accent/10" : "hover:bg-bg-2/70"
                }`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${selected === "all" ? "text-accent" : "text-ink"}`}>
                    Todas las búsquedas
                  </p>
                  <p className="mt-0.5 text-xs text-ink-2">{totalLeads} leads en total</p>
                </div>
                <span className="shrink-0 text-xs text-ink-2/70">Ver</span>
              </button>
            </li>

            {searches.map((search) => (
              <li
                key={search.id}
                className="border-b border-line/60 p-4 last:border-b-0 sm:px-5"
              >
                <div
                  className={`rounded-lg px-3 py-2.5 transition-colors ${
                    selected === search.id ? "bg-accent/10" : "hover:bg-bg-2/70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${selected === search.id ? "text-accent" : "text-ink"}`}>
                        {search.businessName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-2">
                        {search.url} · {formatDate(search.createdAt)} · {search.leadCount}{" "}
                        {search.leadCount === 1 ? "lead" : "leads"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!search.live ? (
                        <span className="badge border-line bg-bg/60 text-ink-2">
                          Demostración
                        </span>
                      ) : null}
                      {/* "Ver" filtra la tabla; este enlace abre la pantalla
                          completa de la búsqueda, con su resumen y su CSV. */}
                      <Link
                        href={`/resultados/${search.id}`}
                        className="btn-ghost !px-2.5 !py-1 !text-xs"
                        title="Abrir la pantalla de resultados de esta búsqueda"
                      >
                        <IconExternal className="h-3.5 w-3.5" />
                        Abrir
                      </Link>
                      <button
                        type="button"
                        onClick={() => onSelect(search.id)}
                        className="btn-ghost !px-2.5 !py-1 !text-xs"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => onFindMore(search)}
                        disabled={findMoreId === search.id}
                        className="btn-ghost !px-2.5 !py-1 !text-xs"
                        title="Buscar nuevos posts en Reddit para esta web"
                      >
                        {findMoreId === search.id ? (
                          <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <IconRefresh className="h-3.5 w-3.5" />
                        )}
                        Buscar más
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}