"use client";

import { useEffect, useState } from "react";
import { api, ApiErrorResponse, type GenerateMessageResponse } from "@/lib/api";
import type { Lead, Message } from "@/lib/types";
import { IconClose, IconCopy, IconLock, IconMessage, IconSpinner } from "@/components/icons";

export type Quota = { used: number; limit: number; remaining: number };

/**
 * Panel lateral del paso 7: genera el mensaje, deja editarlo y copiarlo.
 * El contador de cuota se actualiza con la respuesta del servidor (nunca
 * se calcula en el cliente).
 */
export function MessagePanel({
  lead,
  quota,
  existing,
  onClose,
  onQuota,
  onSaved,
}: {
  lead: Lead;
  quota: Quota;
  existing: Message | undefined;
  onClose: () => void;
  onQuota: (quota: Quota) => void;
  onSaved: (message: Message) => void;
}) {
  const [text, setText] = useState("");
  const [messageId, setMessageId] = useState<string | null>(existing?.id ?? null);
  const [source, setSource] = useState<"ai" | "template" | null>(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (existing) {
      setText(existing.body);
      setMessageId(existing.id);
      setSource(null);
      setDirty(false);
      return;
    }
    setText("");
    setMessageId(null);
    setSource(null);
    setError(null);
    setDirty(false);
    void generate();
    // Solo al abrir el panel: `lead.id` identifica la ejecución.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const result: GenerateMessageResponse = await api.generateMessage(lead.id);
      setText(result.message.body);
      setMessageId(result.message.id);
      setSource(result.source);
      onQuota(result.quota);
      onSaved(result.message);
      setDirty(false);
    } catch (err) {
      if (err instanceof ApiErrorResponse) {
        setError(err.message);
        if (err.payload.quota) onQuota(err.payload.quota);
      } else {
        setError("No se pudo generar el mensaje.");
      }
    } finally {
      setPending(false);
    }
  }

  async function save() {
    if (!messageId) return;
    setSaving(true);
    setError(null);
    try {
      const { message } = await api.saveMessage(messageId, text);
      onSaved(message);
      setDirty(false);
    } catch (err) {
      setError(err instanceof ApiErrorResponse ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("No se pudo copiar. Selecciona el texto y cópialo a mano.");
    }
  }

  const exhausted = quota.remaining <= 0 && !messageId;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Generador de mensajes">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-line bg-bg shadow-card animate-fade-up">
        <header className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <IconMessage className="h-5 w-5 text-accent" />
              Mensaje para {lead.name}
            </h2>
            <p className="mt-1 line-clamp-1 text-xs text-ink-2">{lead.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-ink-2 transition-colors hover:bg-bg-2 hover:text-ink"
          >
            <IconClose />
          </button>
        </header>

        <div className="border-b border-line bg-bg-2/50 px-5 py-3 text-xs text-ink-2">
          <div className="flex items-center justify-between">
            <span>
              {lead.matchScore}% de afinidad · {lead.platform === "reddit" ? `r/${lead.community}` : "LinkedIn"}
            </span>
            <a
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Ver post
            </a>
          </div>
          <p className="mt-1.5 leading-relaxed">{lead.reason}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {pending ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-ink-2">
              <IconSpinner className="h-6 w-6 text-accent" />
              <p className="text-sm">Escribiendo el mensaje…</p>
            </div>
          ) : exhausted ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-bg-2">
                <IconLock className="h-5 w-5 text-ink-2" />
              </div>
              <p className="max-w-xs text-sm text-ink-2">
                Has usado tus {quota.limit} mensajes de esta semana. Se renuevan cada lunes. Puedes
                seguir editando los mensajes que ya tengas escritos.
              </p>
            </div>
          ) : (
            <>
              <label htmlFor="message-body" className="label">
                Mensaje
              </label>
              <textarea
                id="message-body"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setDirty(true);
                }}
                rows={14}
                className="input resize-y !text-sm !leading-relaxed"
                placeholder="Escribe o pega aquí tu mensaje…"
              />

              {source === "template" ? (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-2/70">
                  Este mensaje se compuso con una plantilla a partir de los datos reales del lead
                  porque no hay clave de IA configurada. Al añadir <code>OPENROUTER_API_KEY</code> se
                  generará con el modelo.
                </p>
              ) : null}

              {error ? (
                <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>

        {!pending && !exhausted ? (
          <footer className="flex flex-wrap items-center gap-2 border-t border-line p-5">
            <button type="button" onClick={copy} disabled={!text} className="btn-accent flex-1">
              <IconCopy />
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button type="button" onClick={generate} className="btn-ghost" title="Generar otro">
              Regenerar
            </button>
            {messageId ? (
              <button type="button" onClick={save} disabled={!dirty || saving} className="btn-ghost">
                {saving ? "Guardando…" : "Guardar"}
              </button>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
