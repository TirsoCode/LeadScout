"use client";

import { IconArrow, IconLock, IconReddit, IconTarget } from "@/components/icons";
import { isUnlockedLead, type ScanResponse } from "@/lib/api";
import type { MaskedLead } from "@/lib/mask";
import type { Lead } from "@/lib/types";
import { initials } from "@/lib/utils";

/** Color del % de afinidad: verde brillante siempre, pero más apagado si es bajo. */
function scoreTone(score: number) {
  if (score >= 85) return "text-accent";
  if (score >= 70) return "text-accent/85";
  return "text-accent/70";
}

function PlatformBadge({ platform, community }: { platform: string; community?: string }) {
  return (
    <span className="badge border-line bg-bg/60 text-ink-2">
      <IconReddit className="h-3.5 w-3.5 text-[#ff4500]" />
      {community ? `r/${community}` : "Reddit"}
    </span>
  );
}

/** Una fila de lead. Misma forma visual sea preview (pixelado) o dashboard. */
export function LeadRow({
  lead,
  locked,
  onGenerate,
  generating,
}: {
  lead: MaskedLead | Lead;
  locked: boolean;
  onGenerate?: (lead: Lead) => void;
  generating?: boolean;
}) {
  const unlocked = isUnlockedLead(lead);
  const name = unlocked ? lead.name : lead.nameMasked;
  const title = unlocked ? lead.title : lead.titleMasked;
  const reason = unlocked ? lead.reason : lead.reasonMasked;
  const snippet = unlocked ? lead.snippet : lead.snippetMasked;
  const displayName = name && name.length > 0 ? name : "Lead sin nombre";

  return (
    <li className="group relative flex gap-4 border-b border-line/60 p-4 transition-colors last:border-b-0 hover:bg-bg/25 sm:p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg-2 text-sm font-semibold text-ink-2 ${
          locked ? "pixelated" : ""
        }`}
        aria-hidden={locked}
      >
        {initials(displayName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {/* Nombre: pixelado en preview (SPEC.md) */}
          <span
            className={`font-semibold text-ink ${locked ? "pixelated" : ""}`}
            aria-hidden={locked}
          >
            {displayName}
          </span>
          <PlatformBadge platform={lead.platform} community={lead.community} />
        </div>

        {/* Cargo / título: pixelado en preview */}
        <p className={`mt-1 truncate text-sm text-ink-2 ${locked ? "pixelated" : ""}`} aria-hidden={locked}>
          {title}
        </p>

        {/* Por qué es un lead: pixelado en preview */}
        <p className={`mt-2 line-clamp-2 text-xs text-ink-2/80 ${locked ? "pixelated-peek" : ""}`}>
          {reason}
        </p>

        {unlocked && snippet && snippet !== reason ? (
          <p className="mt-1.5 line-clamp-2 text-xs text-ink-2/60">{snippet}</p>
        ) : null}

        {unlocked && onGenerate ? (
          <button
            type="button"
            onClick={() => onGenerate(lead)}
            disabled={generating}
            className="btn-ghost mt-3 !px-3.5 !py-1.5 !text-xs"
          >
            {generating ? "Generando…" : "Generate message"}
          </button>
        ) : null}
      </div>

      {/* El % de match SIEMPRE se ve claro: es el gancho de conversión */}
      <div className="shrink-0 text-right">
        <div className={`font-serif text-2xl font-bold tabular-nums sm:text-3xl ${scoreTone(lead.matchScore)}`}>
          {lead.matchScore}%
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-2/60">match</div>
      </div>
    </li>
  );
}

/** Resultado pixelado + CTA de desbloqueo (paso 4 del flujo). */
export function PixelatedResults({
  data,
  onUnlock,
}: {
  data: ScanResponse;
  onUnlock: () => void;
}) {
  const { business, leads, total, live } = data;
  const locked = !data.unlocked;

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-up">
      {/* Resumen del negocio: esto sí se ve, es lo que genera confianza */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge border-accent/40 bg-accent/10 text-accent">
            <IconTarget className="h-3.5 w-3.5" />
            Análisis completado
          </span>
          {!live ? (
            <span className="badge border-line bg-bg/60 text-ink-2">Dataset de demostración</span>
          ) : null}
        </div>

        <h2 className="mt-3 font-serif text-xl font-semibold sm:text-2xl">
          {total} leads encontrados para{" "}
          <span className="text-accent">{business.businessName}</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{business.summary || business.service}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {business.keywords.slice(0, 5).map((keyword) => (
            <span key={keyword} className="badge border-line bg-bg/60 text-ink-2/90">
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Lista pixelada */}
      <div className="card relative mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/70 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold">Tus leads</h3>
          <span className="text-xs text-ink-2/70">
            {leads.length} de {total}
          </span>
        </div>

        <ul>
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} locked={locked} />
          ))}
        </ul>

        {/* Velo de bloqueo: el mensaje de "esto es real pero no es tuyo" */}
        {locked ? (
          <div className="relative border-t border-line/70">
            <div className="locked-veil absolute inset-0" aria-hidden="true" />
            <div className="relative px-5 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-line bg-bg-2">
                <IconLock className="h-5 w-5 text-ink-2" />
              </div>
              <p className="mt-3 font-serif text-lg font-semibold sm:text-xl">
                Hay {total} leads aquí esperando
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-2">
                Crea tu cuenta gratis para ver nombres, perfiles, el motivo de cada match y generar un
                mensaje personalizado para cada uno.
              </p>
              <button type="button" onClick={onUnlock} className="btn-accent mt-5">
                Unlock your leads — it&apos;s free
                <IconArrow />
              </button>
              <p className="mt-3 text-xs text-ink-2/60">Sin tarjeta de crédito. Sin límites de leads.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
