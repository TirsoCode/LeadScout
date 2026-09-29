"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiErrorResponse } from "@/lib/api";
import type { Lead, Message } from "@/lib/types";
import { leadToText, linkedinShareUrl, twitterShareUrl, whatsappShareUrl } from "@/lib/leads";
import { copyText } from "@/lib/clipboard";
import { initials, relativeTime } from "@/lib/utils";
import { MessagePanel, type Quota } from "@/components/dashboard/message-panel";
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconExternal,
  IconLinkedin,
  IconMessage,
  IconReddit,
  IconStar,
  IconTarget,
  IconWhatsapp,
  IconXSocial,
} from "@/components/icons";

/**
 * La ficha de un lead (`/lead/[id]`).
 *
 * Es la vista larga de lo que en la fila de la lista solo cabe en dos líneas:
 * el post entero, por qué lo hemos marcado y el mensaje. Todo lo que hace la
 * fila está aquí también (copiar, favorito, compartir, generar mensaje) para
 * que no haya que volver atrás.
 */
export function LeadDetail({
  lead: initialLead,
  businessName,
  backHref,
  quota,
  existingMessage,
}: {
  lead: Lead;
  businessName: string;
  backHref: string;
  quota: Quota;
  existingMessage: Message | undefined;
}) {
  const [lead, setLead] = useState<Lead>(initialLead);
  const [quotaState, setQuota] = useState<Quota>(quota);
  const [message, setMessage] = useState<Message | undefined>(existingMessage);
  const [panelOpen, setPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);

  async function handleCopy() {
    const ok = await copyText(leadToText(lead));
    if (!ok) {
      setNotice("No se pudo copiar. Revisa los permisos del portapapeles del navegador.");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function toggleFavorite() {
    const next = !lead.favorite;
    // Optimista: la estrella responde al instante y se revierte si el servidor
    // dice que no.
    setLead((current) => ({ ...current, favorite: next }));
    setSavingFavorite(true);
    try {
      const { lead: updated } = await api.setFavorite(lead.id, next);
      setLead(updated);
    } catch (err) {
      setLead((current) => ({ ...current, favorite: !next }));
      setNotice(err instanceof ApiErrorResponse ? err.message : "No se pudo guardar el favorito.");
    } finally {
      setSavingFavorite(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-accent"
      >
        <span aria-hidden="true">←</span> Volver a los leads
      </Link>

      {notice ? (
        <p className="mt-4 flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
          <IconCheck className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      ) : null}

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---------------- El post ---------------- */}
        <article className="card p-5 sm:p-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-base font-semibold text-ink-2">
                {initials(lead.name || lead.username || "?")}
              </span>
              <div className="min-w-0">
                <h1 className="font-serif text-2xl font-bold tracking-tight">
                  {lead.name || lead.username}
                </h1>
                <p className="mt-0.5 text-sm text-ink-2">
                  {lead.title}
                  {lead.username ? <span className="text-ink-2/70"> · u/{lead.username.replace(/^u\//, "")}</span> : null}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="font-serif text-3xl font-bold tabular-nums text-accent">{lead.matchScore}%</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-2/60">match</div>
            </div>
          </header>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="badge border-line bg-bg text-ink-2">
              <IconReddit className="h-3.5 w-3.5 text-[#ff4500]" />
              {lead.community ? `r/${lead.community}` : "Reddit"}
            </span>
            <span className="badge border-line bg-bg text-ink-2">
              <IconClock />
              {relativeTime(lead.createdAt)}
            </span>
            {lead.favorite ? (
              <span className="badge border-accent/40 bg-accent/10 text-accent">
                <IconStar className="h-3 w-3" filled />
                Favorito
              </span>
            ) : null}
          </div>

          {/* Por qué lo hemos elegido: es el argumento de venta del producto. */}
          <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
              <IconTarget className="h-3.5 w-3.5" />
              Por qué es un lead para {businessName}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{lead.reason}</p>
          </div>

          <div className="mt-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-2/70">
              El post
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
              {lead.snippet || lead.title}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line/70 pt-5">
            <a
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent"
            >
              Abrir en Reddit
              <IconExternal />
            </a>

            <button type="button" onClick={handleCopy} className="btn-ghost">
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? "Copiado" : "Copiar post"}
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              disabled={savingFavorite}
              aria-pressed={lead.favorite}
              className={`btn-ghost ${lead.favorite ? "!border-accent !text-accent" : ""}`}
            >
              <IconStar filled={lead.favorite} />
              {lead.favorite ? "Guardado" : "Favorito"}
            </button>

            <span className="ml-auto flex items-center gap-1.5">
              <ShareLink href={whatsappShareUrl(lead)} label="Compartir por WhatsApp" className="hover:bg-[#25D366]/10">
                <IconWhatsapp className="h-5 w-5 text-[#25D366]" />
              </ShareLink>
              <ShareLink href={twitterShareUrl(lead)} label="Compartir en X" className="hover:bg-ink/5">
                <IconXSocial className="h-5 w-5 text-ink" />
              </ShareLink>
              <ShareLink href={linkedinShareUrl(lead)} label="Compartir en LinkedIn" className="hover:bg-[#0A66C2]/10">
                <IconLinkedin className="h-5 w-5 text-[#0A66C2]" />
              </ShareLink>
            </span>
          </div>
        </article>

        {/* ---------------- El mensaje ---------------- */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <IconMessage className="h-5 w-5 text-accent" />
              Tu mensaje
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
              Generado con los datos reales de este post: cita lo que ha escrito y va directo al
              grano. Luego lo editas y lo copias.
            </p>

            {message ? (
              <blockquote className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-bg p-3.5 text-sm leading-relaxed text-ink-2">
                {message.body}
              </blockquote>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-line bg-bg p-3.5 text-sm text-ink-2">
                Todavía no has generado el mensaje para este lead.
              </p>
            )}

            <button type="button" onClick={() => setPanelOpen(true)} className="btn-accent mt-4 w-full">
              <IconMessage className="h-4 w-4" />
              {message ? "Editar el mensaje" : "Generar el mensaje"}
            </button>
          </div>
        </aside>
      </div>

      {panelOpen ? (
        <MessagePanel
          lead={lead}
          quota={quotaState}
          existing={message}
          onClose={() => setPanelOpen(false)}
          onQuota={setQuota}
          onSaved={setMessage}
        />
      ) : null}
    </div>
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
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line transition-colors ${className ?? ""}`}
    >
      {children}
    </a>
  );
}
