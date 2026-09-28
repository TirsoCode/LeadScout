import { IconCheck, IconGlobe, IconMessage, IconSearch, IconTarget } from "@/components/icons";

const STATS = [
  { value: "128k+", label: "leads encontrados" },
  { value: "34", label: "nichos cubiertos" },
  { value: "9.2k", label: "usuarios registrados" },
];

export function Stats() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6">
      {STATS.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="font-serif text-2xl font-bold text-accent sm:text-4xl">{stat.value}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-2 sm:text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
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

const FAQS = [
  {
    q: "¿De dónde salen los leads?",
    a: "De Reddit. Buscamos conversaciones donde alguien pide el servicio que tú ofreces, así que el lead es real y el contexto es público.",
  },
  {
    q: "¿Cómo se calcula el porcentaje de match?",
    a: "La IA lee cada post o perfil y estima qué probabilidad hay de que esa persona necesite tu servicio. El porcentaje se acompaña siempre del motivo, para que sepas por qué te lo recomienda.",
  },
  {
    q: "¿Por qué los leads aparecen pixelados?",
    a: "Porque los nombres y perfiles no salen de nuestra base de datos hasta que te registras. Es una demo honesta: ves que los leads existen de verdad, no una captura de pantalla.",
  },
  {
    q: "¿Los mensajes son plantillas?",
    a: "No. Se generan de verdad a partir de tu negocio y del post concreto del lead, en un tono profesional y natural. Puedes editarlos antes de copiarlos.",
  },
  {
    q: "¿Necesito tarjeta de crédito?",
    a: "No. El registro es gratuito y no pedimos ningún pago.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-line/60 bg-bg-2 py-20 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge border-line bg-bg-2 text-ink-2">FAQ</span>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-2xl space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.q} className="card group p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                {faq.q}
                <span className="text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{faq.a}</p>
            </details>
          ))}
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
