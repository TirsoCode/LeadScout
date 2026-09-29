"use client";

import { useState } from "react";
import Link from "next/link";
import { isUnlockedLead } from "@/lib/api";
import type { MaskedLead } from "@/lib/mask";
import type { Lead } from "@/lib/types";
import { leadToText, twitterShareUrl, whatsappShareUrl } from "@/lib/leads";
import { copyText } from "@/lib/clipboard";
import { initials, relativeTime } from "@/lib/utils";
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconExternal,
  IconEyeSmall,
  IconReddit,
  IconShare,
  IconStar,
  IconWhatsapp,
  IconXSocial,
} from "@/components/icons";

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

/** Portapapeles con reserva: si la API falla, se usa el truco del textarea. */
type LeadRowProps = {
  lead: MaskedLead | Lead;
  locked: boolean;
  onGenerate?: (lead: Lead) => void;
  generating?: boolean;
  /** Pide el cambio de favorito al padre; si no se pasa, la estrella no se pinta. */
  onToggleFavorite?: (lead: Lead, favorite: boolean) => void;
  /** Id del lead cuya estrella está en vuelo: se deshabilita para no encadenar clicks. */
  pendingFavoriteId?: string | null;
  /** Enlace a la página de detalle. Si no se pasa, no hay botón de detalle. */
  detailHref?: string;
};

/** Una fila de lead. Misma forma visual sea preview (pixelado) o dashboard. */
export function LeadRow({
  lead,
  locked,
  onGenerate,
  generating,
  onToggleFavorite,
  pendingFavoriteId,
  detailHref,
}: LeadRowProps) {
  const unlocked = isUnlockedLead(lead);
  const name = unlocked ? lead.name : lead.nameMasked;
  const title = unlocked ? lead.title : lead.titleMasked;
  const reason = unlocked ? lead.reason : lead.reasonMasked;
  const snippet = unlocked ? lead.snippet : lead.snippetMasked;
  const displayName = name && name.length > 0 ? name : "Lead sin nombre";

  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  async function handleCopy() {
    if (!unlocked) return;
    const ok = await copyText(leadToText(lead));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  // El onclick captura `lead` narrowed a Lead: `isUnlockedLead` ya lo ha dejado
  // así, pero TS no lo propaga dentro de un closure definido antes.
  const leadOrNull: Lead | null = unlocked ? lead : null;

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

          {unlocked && lead.favorite ? (
            <span className="badge border-accent/40 bg-accent/10 text-accent">
              <IconStar className="h-3 w-3" filled />
              Favorito
            </span>
          ) : null}

          {/* El anónimo no puede ver la fecha exacta del post ni guardarlo, pero
              la antigüedad aproximada no filtra nada identificable. */}
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-2/60">
            <IconClock />
            {relativeTime(lead.createdAt)}
          </span>
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

        {unlocked ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onGenerate ? (
              <button
                type="button"
                onClick={() => onGenerate(lead)}
                disabled={generating}
                className="btn-ghost !px-3.5 !py-1.5 !text-xs"
              >
                {generating ? "Generando…" : "Mensaje"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleCopy}
              className="btn-ghost !px-3.5 !py-1.5 !text-xs"
              title="Copiar el post y su enlace"
            >
              {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>

            {onToggleFavorite ? (
              <button
                type="button"
                onClick={() => leadOrNull && onToggleFavorite(leadOrNull, !leadOrNull.favorite)}
                disabled={pendingFavoriteId === lead.id}
                aria-pressed={lead.favorite}
                className={`btn-ghost !px-3.5 !py-1.5 !text-xs ${
                  lead.favorite ? "!border-accent !text-accent" : ""
                }`}
                title={lead.favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
              >
                <IconStar className="h-3.5 w-3.5" filled={lead.favorite} />
                {lead.favorite ? "Guardado" : "Favorito"}
              </button>
            ) : null}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShareOpen((open) => !open)}
                aria-expanded={shareOpen}
                className="btn-ghost !px-3.5 !py-1.5 !text-xs"
                title="Compartir este lead"
              >
                <IconShare className="h-3.5 w-3.5" />
                Compartir
              </button>

              {shareOpen ? (
                <>
                  {/* Clic fuera = cerrar. El overlay es invisible y está detrás. */}
                  <button
                    type="button"
                    aria-label="Cerrar"
                    tabIndex={-1}
                    onClick={() => setShareOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute left-0 top-full z-20 mt-1.5 flex gap-1 rounded-lg border border-line bg-white p-1.5 shadow-card">
                    <ShareLink
                      href={whatsappShareUrl(lead)}
                      label="WhatsApp"
                      className="text-[#25D366]"
                    >
                      <IconWhatsapp className="h-4 w-4" />
                    </ShareLink>
                    <ShareLink href={twitterShareUrl(lead)} label="X" className="text-ink">
                      <IconXSocial className="h-4 w-4" />
                    </ShareLink>
                    <ShareLink href={lead.url} label="Abrir el post" className="text-accent">
                      <IconExternal className="h-4 w-4" />
                    </ShareLink>
                  </div>
                </>
              ) : null}
            </div>

            {detailHref ? (
              <Link href={detailHref} className="btn-ghost !px-3.5 !py-1.5 !text-xs">
                <IconEyeSmall />
                Ver detalle
              </Link>
            ) : null}

            {lead.url ? (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !px-3.5 !py-1.5 !text-xs"
                title="Abrir el post original en Reddit"
              >
                <IconExternal className="h-3.5 w-3.5" />
                Abrir en Reddit
              </a>
            ) : null}
          </div>
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

function ShareLink({
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
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-bg-2 ${className ?? ""}`}
    >
      {children}
    </a>
  );
}

