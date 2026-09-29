"use client";

import { IconCheck, IconSpinner } from "@/components/icons";

/**
 * Pantalla de carga del scan (SPEC.md): "Analyzing your business...".
 *
 * Va alternando los hitos reales del scan para que el usuario entienda que no
 * está mirando una barra de progreso inventada, y de paso es lo único que ve
 * mientras la búsqueda corre: por eso va centrada a pantalla completa.
 */
const STEPS = [
  "Analizando tu web…",
  "Extrayendo tu servicio y cliente ideal…",
  "Buscando en Reddit…",
  "Puntuando afinidad de cada lead…",
];

export function Analyzing({ businessName }: { businessName?: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center text-center">
      {/* Radar: aro giratorio con degradado + pulso. El giro dice "buscando"
          sin necesidad de una barra con porcentaje falso. */}
      <div className="relative mb-9 h-28 w-28">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-accent/10"
        />
        <span
          aria-hidden="true"
          className="absolute inset-3 rounded-full border border-accent/20"
        />
        <span
          aria-hidden="true"
          className="absolute inset-3 animate-[spin_2.6s_linear_infinite] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(21,128,61,0) 0deg, rgba(21,128,61,0.28) 140deg, rgba(21,128,61,0.85) 360deg)",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/25 bg-white">
            <IconSpinner className="h-7 w-7 text-accent" />
          </span>
        </span>
      </div>

      <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {businessName ? `Analizando ${businessName}…` : "Analizando tu negocio…"}
      </h2>
      <p className="mt-3 max-w-sm text-ink-2">
        Estamos leyendo tu web y buscando en Reddit quién necesita justo lo que vendes. En unos
        segundos te llevamos a tus resultados.
      </p>

      {/* Barra indeterminada: el brillo recorre el carril, nunca miente con un % */}
      <div aria-hidden="true" className="shimmer mt-9 h-1.5 w-full overflow-hidden rounded-full" />

      <ol className="mt-9 w-full space-y-2.5 text-left" aria-live="polite">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="flex animate-fade-up items-center gap-3 rounded-lg border border-line/70 bg-bg-2/60 px-4 py-2.5"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {index === 0 ? (
              <IconSpinner className="h-4 w-4 shrink-0 text-accent" />
            ) : (
              <IconCheck className="h-4 w-4 shrink-0 text-accent/40" />
            )}
            <span className={index === 0 ? "text-sm font-medium text-ink" : "text-sm text-ink-2/70"}>
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
