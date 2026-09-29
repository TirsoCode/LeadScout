"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiErrorResponse } from "@/lib/api";
import { validateUrlInput } from "@/lib/utils";
import { IconArrow, IconClose, IconSearch, IconSparkle } from "@/components/icons";
import { Analyzing } from "@/components/landing/analyzing";

type Phase = "idle" | "analyzing";

const EXAMPLES = ["stripe.com", "fiverr.com", "awebdesigner.com"];

/**
 * El hero de la landing: la caja de la URL y, mientras el scan corre, la
 * pantalla de análisis. Cuando el scan termina NO se pinta aquí: navega a
 * `/resultados/<searchId>`, que es su propia pantalla. La landing queda como
 * punto de entrada y la lista de leads vive en su sitio.
 *
 * `preview` (la tarjeta del mensaje) y `footer` (la nota de datos) los pasa
 * la página desde el servidor. Aquí se decide cuándo se ven: en fase de
 * análisis se retiran, para que la pantalla de carga ocupe la página entera
 * bien centrada en vez de quedarse en la columna de la izquierda con media
 * pantalla vacía al lado.
 */
export function ScanExperience({
  preview,
  footer,
}: {
  preview?: ReactNode;
  footer?: ReactNode;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleScan(event: React.FormEvent) {
    event.preventDefault();
    if (phase === "analyzing") return;

    // Validación en el cliente para el feedback inmediato. El servidor
    // vuelve a validar: nunca confía en lo que le mandamos.
    const validation = validateUrlInput(url);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setError(null);
    setPhase("analyzing");

    try {
      const result = await api.scan(validation.url);
      // `refresh()` antes de navegar: si el scan vino con sesión, el servidor
      // tiene que repintar la navbar con el estado de cuenta.
      if (result.unlocked) router.refresh();
      router.push(`/resultados/${result.searchId}`);
    } catch (err) {
      setPhase("idle");
      setError(
        err instanceof ApiErrorResponse ? err.message : "No se pudo completar el análisis.",
      );
    }
  }

  // ---------------- Fase 2: análisis a pantalla completa ----------------
  if (phase === "analyzing") {
    return (
      <div className="container-page pb-20 pt-10 sm:pt-14">
        <Analyzing />
      </div>
    );
  }

  // ---------------- Fase 1: promesa + buscador + tarjeta ----------------
  return (
    <div className="container-page grid items-start gap-12 pb-16 pt-8 sm:pb-20 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div>
        <HeroCopy />

        <div className="mt-8 w-full">
          <form onSubmit={handleScan} noValidate>
            {/* Buscador en píldora: icono + input + botón dentro del mismo
                borde redondeado, como un solo control. */}
            <div
              className={`flex items-center gap-2 rounded-full border bg-white py-1.5 pl-5 pr-1.5 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 ${
                error ? "border-red-500/70" : "border-line"
              }`}
            >
              <IconSearch
                className={`h-5 w-5 shrink-0 ${error ? "text-red-500" : "text-ink-2/60"}`}
              />
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                aria-label="URL de tu web"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "url-error" : undefined}
                placeholder="Enter your website URL"
                className="w-full min-w-0 border-0 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-ink-2/70"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  // En cuanto el usuario corrige, el error desaparece.
                  if (error) setError(null);
                }}
              />
              <button
                type="submit"
                className="btn-accent shrink-0 !rounded-full !px-5 !py-3 !text-sm"
              >
                Buscar leads
                <IconArrow className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <p
                id="url-error"
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600"
              >
                <IconClose className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-2">
            <span>Prueba con:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setUrl(example)}
                className="rounded-full border border-line px-2.5 py-1 transition-colors hover:border-accent hover:text-accent"
              >
                {example}
              </button>
            ))}
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs text-ink-2/70">
            <IconSparkle className="h-3.5 w-3.5 text-accent" />
            No hace falta registro. Verás los resultados al instante.
          </p>
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>

      {preview}
    </div>
  );
}

/** Titular y párrafo del hero. */
export function HeroCopy() {
  return (
    <div className="max-w-xl">
      {/* Tres líneas, la última en verde con un subrayado tipo rotulador: es el
          recurso visual que ancla la promesa en la frase. */}
      <h1 className="font-serif text-[2.75rem] font-bold leading-[1.03] tracking-tight sm:text-6xl lg:text-[4.25rem]">
        Encuentra
        <br />
        clientes que
        <br />
        <span className="relative inline-block">
          <span className="text-accent">sí responden.</span>
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 left-0 h-2 w-full rounded-full bg-accent/25"
          />
        </span>
      </h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-2 sm:text-lg">
        La mayoría manda mensajes a negocios saturados y no recibe nada. LeadScout encuentra a
        quienes tienen nuevas necesidades, presupuesto fresco y buscan proveedor ahora mismo.
      </p>
    </div>
  );
}
