"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Lead, Message } from "@/lib/types";
import { copyText } from "@/lib/clipboard";
import { IconCheck, IconCopy, IconSpinner } from "@/components/icons";
import type { Quota } from "./message-panel";

/**
 * "Copiar todos los mensajes": genera los mensajes que falten (uno por lead)
 * y los copia de golpe al portapapeles, cada uno con su etiqueta y afinidad.
 */
export function BulkCopyButton({
  leads,
  messages,
  onGenerated,
}: {
  leads: Lead[];
  messages: Message[];
  onGenerated: (message: Message, quota: Quota) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleCopyAll() {
    if (busy || leads.length === 0) return;

    setBusy(true);
    setStatus(null);

    const byLead = new Map<string, Message>();
    for (const message of messages) byLead.set(message.leadId, message);

    let generated = 0;
    let failed = 0;

    for (let index = 0; index < leads.length; index++) {
      const lead = leads[index];
      if (byLead.has(lead.id)) continue;

      setStatus({ text: `Generando mensaje ${index + 1} de ${leads.length}…`, ok: false });
      try {
        const result = await api.generateMessage(lead.id);
        byLead.set(lead.id, result.message);
        onGenerated(result.message, result.quota);
        generated++;
      } catch {
        failed++;
      }
    }

    const parts: string[] = [];
    leads.forEach((lead, index) => {
      const message = byLead.get(lead.id);
      if (!message) return;
      parts.push(
        `[${index + 1}] ${lead.name || lead.username || "Lead"} — ${lead.matchScore}% de afinidad${
          lead.community ? ` · r/${lead.community}` : ""
        }\n${message.body.trim()}`,
      );
    });

    if (parts.length === 0) {
      setStatus({ text: "Todavía no hay mensajes que copiar.", ok: false });
    } else {
      await copyText(parts.join("\n\n---\n\n"));
      setStatus({
        text: `Copiados ${parts.length} mensaje${parts.length === 1 ? "" : "s"}${
          generated ? ` (${generated} generado${generated === 1 ? "" : "s"} ahora)` : ""
        }${failed ? ` · ${failed} fallaron` : ""}.`,
        ok: true,
      });
    }

    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={handleCopyAll}
      disabled={busy || leads.length === 0}
      className="btn-ghost"
      title={leads.length === 0 ? "Aún no hay leads" : "Genera y copia todos los mensajes de golpe"}
    >
      {busy ? (
        <IconSpinner className="h-4 w-4 animate-spin" />
      ) : status?.ok ? (
        <IconCheck className="h-4 w-4" />
      ) : (
        <IconCopy className="h-4 w-4" />
      )}
      {busy ? "Copiando todos…" : "Copiar todos los mensajes"}
    </button>
  );
}