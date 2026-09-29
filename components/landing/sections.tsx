import { IconCheck, IconGlobe, IconMessage, IconSearch, IconTarget } from "@/components/icons";

const STATS = [
  { value: "128k+", label: "leads encontrados" },
  { value: "34", label: "nichos cubiertos" },
  { value: "9.2k", label: "usuarios registrados" },
];

/**
 * Nota de datos en monoespaciada, bajo el buscador: lee como el pie de un
 * dataset ("N registros · N documentos · fuente X"), no como un contador
 * de métricas.
 */
export function Stats() {
  return (
    <p className="font-mono text-xs leading-relaxed text-ink-2/80 sm:text-[13px]">
      {STATS.map((stat, index) => (
        <span key={stat.label}>
          {index > 0 ? <span className="text-ink-2/40">{" · "}</span> : null}
          {stat.value} {stat.label}
        </span>
      ))}
    </p>
  );
}

const STEPS = [
  {
    icon: IconGlobe,
    title: "Pega tu URL",
    text: "Escribe la web de tu negocio. No hace falta registro ni tarjeta. En segundos sabemos qué vendes y a quién te diriges.",
  },
  {
    icon: IconSearch,
    title: "Buscamos por ti",
    text: "La IA recorre Reddit buscando personas que estén pidiendo exactamente tu servicio, ahora mismo.",
  },
  {
    icon: IconTarget,
    title: "Ordenamos por afinidad",
    text: "Cada lead lleva un porcentaje de match y el motivo exacto por el que encaja contigo. Lo más caliente, arriba.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-line/60 bg-bg-2 py-20 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge border-line bg-bg-2 text-ink-2">Cómo funciona</span>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Tres pasos, cero effort
          </h2>
          <p className="mt-3 text-ink-2">
            Lo que antes te llevaba una tarde de manual researching, aquí tarda un minuto.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card relative p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="font-serif text-sm font-semibold text-ink-2/60">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PERKS = [
  { text: "Leads y búsquedas ilimitados" },
  { text: "% de afinidad en cada lead, con su motivo" },
  { text: "Mensajes de IA personalizados, no plantillas" },
  { text: "Mensajes de IA ilimitados por ahora" },
  { text: "Puedes editar tus mensajes sin límite" },
  { text: "Sin tarjeta de crédito. Nunca." },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge border-line bg-bg-2 text-ink-2">Pricing</span>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Ahora mismo, gratis
          </h2>
          <p className="mt-3 text-ink-2">
            Estamos en fase de validar el producto, así que todo es gratis. Si te sirve, úsalo.
          </p>
        </div>

        <div className="card mx-auto mt-12 max-w-lg p-7 shadow-glow">
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-2xl font-semibold">Free</h3>
            <div>
              <span className="font-serif text-4xl font-bold">0 €</span>
              <span className="text-sm text-ink-2"> / para siempre</span>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {PERKS.map((perk) => (
              <li key={perk.text} className="flex items-start gap-2.5 text-sm">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="text-ink-2">{perk.text}</span>
              </li>
            ))}
          </ul>

          <a href="#top" className="btn-accent mt-7 w-full">
            Empezar gratis
          </a>
        </div>
      </div>
    </section>
  );
}

const MESSAGE_PREVIEW = [
  { name: "Sarah M.", line: "Vi tu publicación en r/smallbusiness sobre la web anticuada de tu clínica…" },
  { name: "Lead 3 · 94% match", line: "Hola, vi que buscas rediseñar el packaging de tu marca de café…" },
  { name: "Lead 7 · 87% match", line: "Estaba testimonial sobre el precio del desarrollo de tu app…" },
];

/** Muestra el paso 7 (generador de mensajes) con un ejemplo real y legible. */
export function MessageTeaser() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="badge border-line bg-bg-2 text-ink-2">
            <IconMessage className="h-3.5 w-3.5" />
            Generador de mensajes
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Un mensaje para cada lead, no un correo en serie
          </h2>
          <p className="mt-4 leading-relaxed text-ink-2">
            El mensaje se escribe teniendo en cuenta tu negocio, el post del lead y el motivo por el
            que encaja. Tono profesional pero humano, sin spam y sin placeholders tipo «[nombre]». Lo
            editas si quieres y lo copias.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-ink-2">
            {["Mensajes de IA ilimitados por ahora", "Edición ilimitada de lo que ya escribiste", "Sin enlaces en Reddit, porque se lee como spam"].map(
              (item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Maqueta de mensajes, con el mismo lenguaje visual que el producto. */}
        <div className="card divide-y divide-line/60 p-0">
          {MESSAGE_PREVIEW.map((item) => (
            <div key={item.name} className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-accent">{item.name}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{item.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PREVIEW_MESSAGE = {
  to: "u/taller_madera_norte",
  subject: "Tu web no carga en móvil",
  score: 94,
  body: [
    "Hola, vi tu publicación en r/muebles: la web del taller no carga en móvil y ahí se te están yendo los pedidos.",
    "Justo la semana pasada entregué una tienda para un carpintero con el mismo problema.",
    "¿Te cuento en 15 minutos cómo lo resolvimos?",
  ],
};

/** Anillo de afinidad: el arco mide el score, el % va en el centro. */
function MatchRing({ score }: { score: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="relative h-[74px] w-[74px] shrink-0"
      role="img"
      aria-label={`${score}% de afinidad`}
    >
      <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="#e6ece8" strokeWidth="5" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="#15803d"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none text-ink">{score}%</span>
        <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-ink-2">
          match
        </span>
      </div>
    </div>
  );
}

/**
 * La tarjeta del hero: un mensaje real (para / asunto / cuerpo) con su
 * afinidad. Es la prueba visible de lo que el producto hace por ti.
 */
export function MessagePreview() {
  const last = PREVIEW_MESSAGE.body.length - 1;

  return (
    <aside className="card overflow-hidden rounded-2xl bg-white shadow-card" aria-label="Ejemplo de mensaje generado">
      <div className="flex items-start justify-between gap-5 border-b border-line/70 px-5 py-5 sm:px-7 sm:py-6">
        <dl className="min-w-0 space-y-3">
          <div className="flex items-baseline gap-4">
            <dt className="w-[62px] shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-2/70">
              Para
            </dt>
            <dd className="truncate text-[15px] font-semibold text-ink">{PREVIEW_MESSAGE.to}</dd>
          </div>
          <div className="flex items-baseline gap-4">
            <dt className="w-[62px] shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-2/70">
              Asunto
            </dt>
            <dd className="truncate text-[15px] text-ink-2">{PREVIEW_MESSAGE.subject}</dd>
          </div>
        </dl>
        <MatchRing score={PREVIEW_MESSAGE.score} />
      </div>

      <div className="space-y-4 px-5 py-6 text-[15px] leading-relaxed text-ink-2 sm:px-7 sm:py-7">
        {PREVIEW_MESSAGE.body.map((paragraph, index) => (
          <p key={paragraph}>
            {paragraph}
            {index === last ? (
              // Cursor de "se está escribiendo ahora mismo".
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-ink-2/70"
              />
            ) : null}
          </p>
        ))}
      </div>
    </aside>
  );
}
