"use client";

import { useState } from "react";
import { api, ApiErrorResponse, isUnlockedLead, type ScanResponse } from "@/lib/api";
import { validateUrlInput } from "@/lib/utils";
import type { Lead } from "@/lib/types";
import { IconCheck, IconSearch, IconSpinner } from "@/components/icons";

/** Resultado de un scan hecho desde el propio panel, listo para mezclar. */
export type ScannedResult = {
  searchId: string;
  business: ScanResponse["business"];
  leads: Lead[];
  live: boolean;
  createdAt: string;
};

/**
 * "Nueva búsqueda sin salir": analiza una web nueva desde el dashboard y le
 * pasa el resultado al cliente para que lo mezcle con los leads actuales.
 */
export function SearchBox({ onScanned }: { onScanned: (result: ScannedResult) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const validation = validateUrlInput(url);
    if (!validation.ok) {
      setError(validation.error);
      setDone(null);
      return;
    }

    setError(null);
    setDone(null);
    setBusy(true);

    try {
      const result = await api.scan(validation.url);
      // Con sesión activa el scan devuelve leads completos; filtramos por si
      // algún día el contrato cambia y llega uno enmascarado.
      const leads = result.leads.filter(isUnlockedLead) as Lead[];
      onScanned({
        searchId: result.searchId,
        business: result.business,
        leads,
        live: result.live,
        createdAt: result.createdAt,
      });
      setUrl("");
      setDone(
        `${result.business.businessName}: ${leads.length} lead${leads.length === 1 ? "" : "s"} añadido${leads.length === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiErrorResponse ? err.message : "No se pudo completar el análisis.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
            <IconSearch className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Analizar otra web</p>
            <p className="text-xs text-ink-2">Escanea un negocio nuevo y sus leads caen aquí.</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="tuweb.com"
            aria-label="Web a analizar"
            disabled={busy}
            className="input sm:w-64"
          />
          <button type="submit" disabled={busy} className="btn-accent shrink-0">
            {busy ? (
              <>
                <IconSpinner className="h-4 w-4 animate-spin" />
                Analizando…
              </>
            ) : (
              <>
                <IconSearch className="h-4 w-4" />
                Analizar
              </>
            )}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-sm text-accent">
          <IconCheck className="h-4 w-4 shrink-0" />
          {done}
        </p>
      ) : null}
    </form>
  );
}