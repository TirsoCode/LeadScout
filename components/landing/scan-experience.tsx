"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiErrorResponse } from "@/lib/api";
import { validateUrlInput } from "@/lib/utils";
import { IconArrow, IconClose, IconGlobe, IconSearch, IconSparkle } from "@/components/icons";
import { Analyzing } from "@/components/landing/analyzing";

type Phase = "idle" | "analyzing";

const EXAMPLES = ["stripe.com", "fiverr.com", "awebdesigner.com"];

/**
 * El input de la landing. Cuando el scan termina NO se pinta aquí: navega a
 * `/resultados/<searchId>`, que es su propia pantalla. La landing queda como
 * punto de entrada y la lista de leads vive en su sitio.
 */
export function ScanExperience() {
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

  return (
    <>
      {/* ---------------- Paso 1: la caja de la URL ---------------- */}
      {phase === "idle" ? (
        <div className="mx-auto w-full max-w-2xl">
          <form onSubmit={handleScan} noValidate>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <IconGlobe
                  className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                    error ? "text-red-400" : "text-ink-2/70"
                  }`}
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
                  className={`input !py-3.5 !pl-12 !text-base ${
                    error ? "!border-red-500/60 focus:!ring-red-500/60" : ""
                  }`}
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    // En cuanto el usuario corrige, el error desaparece.
                    if (error) setError(null);
                  }}
                />
              </div>
              <button type="submit" className="btn-accent shrink-0 !px-6 !py-3.5 !text-base">
                <IconSearch className="h-4 w-4" />
                Buscar leads
              </button>
            </div>

            {error ? (
              <p
                id="url-error"
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
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
      ) : null}

      {/* ---------------- Paso 2: análisis ---------------- */}
      {phase === "analyzing" ? <Analyzing /> : null}
    </>
  );
}

/** Hero de la landing. Separado para que la página pueda alternarlo. */
export function HeroCopy() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
        Clientes potenciales que
        <br />
        <span className="text-accent">sí que responden.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
        La mayoría envía spam a negocios saturados y no recibe nada. LeadScout encuentra a quienes tienen nuevas necesidades, presupuesto fresco y buscan proveedores ahora mismo.
      </p>
    </div>
  );
}

export function HeroActions() {
  return (
    <a href="#como-funciona" className="btn-ghost">
      Cómo funciona
      <IconArrow />
    </a>
  );
}
