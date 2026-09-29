import type { MaskedLead } from "@/lib/mask";
import type { Lead } from "@/lib/types";
import { summarizeLeads, type LeadSummary } from "@/lib/leads";
import { IconChart, IconClock, IconTarget } from "@/components/icons";

/**
 * El resumen de la búsqueda: reparto por afinidad, comunidades donde salió la
 * conversación y antigüedad de los posts.
 *
 * Solo consume `matchScore`, `community` y `createdAt`, que es exactamente lo
 * que `lib/mask.ts` deja en claro. Por eso el mismo componente sirve para la
 * preview anónima (donde da ganas ver que hay reparto de verdad) y para los
 * leads desbloqueados.
 */
export function LeadStats({ leads }: { leads: (MaskedLead | Lead)[] }) {
  const summary = summarizeLeads(leads);
  return <Stats summary={summary} />;
}

function Stats({ summary }: { summary: LeadSummary }) {
  const { total, average, best, hot, fresh, communities, buckets } = summary;

  return (
    <section className="card p-5 sm:p-6" aria-label="Resumen de la búsqueda">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          <IconChart className="h-4 w-4" />
        </span>
        <h2 className="font-serif text-lg font-semibold">Cómo se reparten</h2>
      </div>

      {/* Cifras grandes */}
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Leads" value={String(total)} />
        <Stat label="Afinidad media" value={`${average}%`} />
        <Stat label="Mejor match" value={`${best}%`} tone="accent" />
        <Stat
          label="Últimos 7 días"
          value={String(fresh)}
          icon={<IconClock />}
        />
      </dl>

      {/* Reparto por tramos. La barra es la proporción de `total`. */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Reparto por afinidad</h3>
          <span className="text-xs text-ink-2/70">{hot} por encima del 85%</span>
        </div>

        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-line/60" aria-hidden="true">
          {total > 0
            ? buckets.map((bucket) => (
                <span
                  key={bucket.min}
                  className={bucket.min >= 85 ? "bg-accent" : bucket.min >= 70 ? "bg-accent/55" : "bg-accent/25"}
                  style={{ width: `${(bucket.leads.length / total) * 100}%` }}
                />
              ))
            : null}
        </div>

        <ul className="mt-3 space-y-1.5">
          {buckets.map((bucket) => (
            <li key={bucket.min} className="flex items-center gap-2.5 text-xs">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  bucket.min >= 85 ? "bg-accent" : bucket.min >= 70 ? "bg-accent/55" : "bg-accent/25"
                }`}
                aria-hidden="true"
              />
              <span className="font-medium text-ink">{bucket.label}</span>
              <span className="truncate text-ink-2/70">— {bucket.hint}</span>
              <span className="ml-auto shrink-0 tabular-nums text-ink-2">
                {bucket.leads.length}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Comunidades: solo se pintan si hay más de una, si no es ruido. */}
      {communities.length > 1 ? (
        <div className="mt-6 border-t border-line/70 pt-5">
          <h3 className="text-sm font-semibold">Dónde están hablando de esto</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {communities.slice(0, 8).map((community) => (
              <span key={community.name} className="badge border-line bg-bg/60 text-ink-2">
                r/{community.name}
                <span className="tabular-nums text-ink-2/60">· {community.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "accent";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-bg/60 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-2/70">
        {icon}
        {label}
      </dt>
      <dd
        className={`mt-1 font-serif text-2xl font-bold tabular-nums ${
          tone === "accent" ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Tarjeta con el icono de diana: el encabezado de "encontramos X leads". */
export function ScanHeadline({
  total,
  businessName,
  live,
}: {
  total: number;
  businessName: string;
  live: boolean;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge border-accent/40 bg-accent/10 text-accent">
          <IconTarget className="h-3.5 w-3.5" />
          Análisis completado
        </span>
        {!live ? (
          <span className="badge border-line bg-bg/60 text-ink-2">Dataset de demostración</span>
        ) : null}
      </div>
      <h2 className="mt-3 font-serif text-xl font-semibold sm:text-2xl">
        {total} leads encontrados para <span className="text-accent">{businessName}</span>
      </h2>
    </div>
  );
}
