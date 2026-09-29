"use client";

import { useMemo, useState } from "react";
import { LeadRow } from "@/components/results/lead-row";
import type { Lead, LeadSort } from "@/lib/types";
import { LEAD_SORTS } from "@/lib/types";
import { sortLeads } from "@/lib/leads";
import { isUnlockedLead } from "@/lib/api";
import type { MaskedLead } from "@/lib/mask";
import { IconSort, IconStar } from "@/components/icons";

type Filter = { platform: "all" | "reddit"; minScore: number };

const SCORE_TIERS = [
  { value: 0, label: "Todos" },
  { value: 70, label: "≥ 70%" },
  { value: 85, label: "≥ 85%" },
  { value: 95, label: "≥ 95%" },
];

/**
 * Lista de leads del dashboard: leads reales, sin pixelar, con filtros por
 * plataforma y por % de afinidad (SPEC.md, paso 6). Además ordena la lista y
 * deja filtrar por favoritos.
 */
export function LeadsTable({
  leads,
  onGenerate,
  generatingId,
  onToggleFavorite,
  pendingFavoriteId,
}: {
  leads: (Lead | MaskedLead)[];
  onGenerate: (lead: Lead) => void;
  generatingId: string | null;
  onToggleFavorite?: (lead: Lead, favorite: boolean) => void;
  pendingFavoriteId?: string | null;
}) {
  const [filter, setFilter] = useState<Filter>({ platform: "all", minScore: 0 });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LeadSort>("score");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const favoriteCount = useMemo(
    () => leads.filter((lead) => isUnlockedLead(lead) && lead.favorite).length,
    [leads],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = leads.filter((lead) => {
      if (filter.platform !== "all" && lead.platform !== filter.platform) return false;
      if (lead.matchScore < filter.minScore) return false;
      if (onlyFavorites && !(isUnlockedLead(lead) && lead.favorite)) return false;
      if (!needle) return true;
      const haystack = isUnlockedLead(lead)
        ? `${lead.name} ${lead.title} ${lead.snippet} ${lead.reason} ${lead.username} ${lead.community ?? ""}`
        : `${lead.nameMasked} ${lead.titleMasked}`;
      return haystack.toLowerCase().includes(needle);
    });
    return sortLeads(matched, sort);
  }, [leads, filter, query, sort, onlyFavorites]);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="font-serif text-lg font-semibold">Tus leads</h2>
          <p className="mt-0.5 text-xs text-ink-2">
            {filtered.length} de {leads.length} leads
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o texto…"
            aria-label="Buscar leads"
            className="input !py-2 !text-sm sm:w-56"
          />

          {onToggleFavorite ? (
            <button
              type="button"
              onClick={() => setOnlyFavorites((value) => !value)}
              aria-pressed={onlyFavorites}
              className={`btn-ghost !px-3 !py-2 !text-sm ${onlyFavorites ? "!border-accent !text-accent" : ""}`}
              disabled={favoriteCount === 0}
              title={favoriteCount === 0 ? "Todavía no tienes favoritos" : undefined}
            >
              <IconStar filled={onlyFavorites} />
              Solo favoritos
            </button>
          ) : null}

          <select
            value={filter.platform}
            onChange={(event) =>
              setFilter((current) => ({ ...current, platform: event.target.value as Filter["platform"] }))
            }
            aria-label="Filtrar por plataforma"
            className="input !w-auto !py-2 !text-sm"
          >
            <option value="all">Todas las plataformas</option>
            <option value="reddit">Solo Reddit</option>
          </select>

          <select
            value={filter.minScore}
            onChange={(event) =>
              setFilter((current) => ({ ...current, minScore: Number(event.target.value) }))
            }
            aria-label="Filtrar por afinidad"
            className="input !w-auto !py-2 !text-sm"
          >
            {SCORE_TIERS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <IconSort className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-2/60" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as LeadSort)}
              aria-label="Ordenar leads"
              className="input !w-auto !py-2 !pl-8 !text-sm"
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

      {filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-ink-2">
          {onlyFavorites
            ? "No tienes favoritos todavía. Marca alguno con la estrella."
            : "Ningún lead cumple estos filtros. Prueba a bajar el mínimo de afinidad."}
        </p>
      ) : (
        <ul>
          {filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              locked={!isUnlockedLead(lead)}
              onGenerate={onGenerate}
              generating={generatingId === lead.id}
              onToggleFavorite={onToggleFavorite}
              pendingFavoriteId={pendingFavoriteId}
              detailHref={isUnlockedLead(lead) ? `/lead/${lead.id}` : undefined}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
