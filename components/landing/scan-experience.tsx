"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiErrorResponse, type ScanResponse } from "@/lib/api";
import { validateUrlInput } from "@/lib/utils";
import { IconArrow, IconClose, IconGlobe, IconSearch, IconSparkle } from "@/components/icons";
import { Analyzing } from "@/components/landing/analyzing";
import { PixelatedResults } from "@/components/landing/pixelated-results";
import { AuthModal } from "@/components/auth/auth-modal";

type Phase = "idle" | "analyzing" | "results";

const EXAMPLES = ["stripe.com", "fiverr.com", "awebdesigner.com"];

export function ScanExperience({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScanResponse | null>(null);
  const [authOpen, setAuthOpen] = useState<"signup" | "login" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // La navbar navega con router.push("/?auth=signup|login"). Como eso no
  // remonta el componente, hay que leer la query con useSearchParams (que sí
  // re-renderiza al cambiarla) en vez de solo en el useEffect de montaje.
  //
  // `handledRef` evita que un mismo aviso se reaplique: si no, cerrar el modal
  // y un re-render volverían a abrirlo.
  const handledRef = useRef<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const auth = searchParams.get("auth");
    const err = searchParams.get("err");
    if (!auth && !err) return;

    const key = `${auth ?? ""}|${err ?? ""}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    if (auth === "signup" || auth === "login") setAuthOpen(auth);
    if (err) setAuthError(err);

    // Limpiamos la query: si el usuario recarga, el modal no se reabre solo.
    window.history.replaceState(null, "", window.location.pathname);
  }, [searchParams]);

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
      setData(result);
      setPhase("results");
      // Si el usuario ya está registrado, sus leads llegan completos.
      if (result.unlocked) router.refresh();
    } catch (err) {
      setPhase("idle");
      setError(
        err instanceof ApiErrorResponse ? err.message : "No se pudo completar el análisis.",
      );
    }
  }

  function reset() {
    setPhase("idle");
    setData(null);
    setError(null);
    setUrl("");
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

      {/* ---------------- Paso 2-3: análisis ---------------- */}
      {phase === "analyzing" ? <Analyzing /> : null}

      {/* ---------------- Paso 4: resultados pixelados ---------------- */}
      {phase === "results" && data ? (
        <div>
          <PixelatedResults
            data={data}
            onUnlock={() => (signedIn ? router.push("/dashboard") : setAuthOpen("signup"))}
          />
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={reset}
              className="text-sm text-ink-2 underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              ← Analizar otra web
            </button>
          </div>
        </div>
      ) : null}

      <AuthModal
        open={authOpen !== null}
        mode={authOpen ?? "signup"}
        initialError={authError}
        onClose={() => {
          setAuthOpen(null);
          setAuthError(null);
        }}
        onSuccess={() => {
          setAuthOpen(null);
          setAuthError(null);
        }}
      />
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
