"use client";

import { IconCheck, IconSpinner } from "@/components/icons";

/**
 * Pantalla de carga del paso 2-3 (SPEC.md): "Analyzing your business...".
 * Vamos alternando los hitos reales del scan para que el usuario entienda que
 * no está mirando una barra de progreso inventada.
 */
const STEPS = [
  "Analizando tu web…",
  "Extrayendo tu servicio y cliente ideal…",
  "Buscando en Reddit…",
  "Puntuando afinidad de cada lead…",
];

export function Analyzing({ businessName }: { businessName?: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-2 text-center">
      <div className="relative mb-7">
        <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" aria-hidden="true" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-bg-2">
          <IconSpinner className="h-8 w-8 text-accent" />
        </div>
      </div>

      <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
        {businessName ? `Analizando ${businessName}…` : "Analizando tu negocio…"}
      </h2>
      <p className="mt-2 text-sm text-ink-2">Esto tarda unos segundos.</p>

      <ol className="mt-8 w-full space-y-2.5 text-left" aria-live="polite">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="flex animate-fade-up items-center gap-3 rounded-lg border border-line/70 bg-bg-2/60 px-4 py-2.5"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {index === 0 ? (
              <IconSpinner className="h-4 w-4 shrink-0 text-accent" />
            ) : (
              <IconCheck className="h-4 w-4 shrink-0 text-line" />
            )}
            <span className={index === 0 ? "text-sm text-ink" : "text-sm text-ink-2/60"}>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
