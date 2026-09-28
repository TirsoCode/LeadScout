import Link from "next/link";
import { Logo } from "@/components/icons";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Features",
    links: [
      { label: "Análisis de web con IA", href: "/#como-funciona" },
      { label: "Búsqueda en Reddit", href: "/#como-funciona" },
      { label: "Puntuación de afinidad", href: "/#como-funciona" },
      { label: "Mensajes personalizados", href: "/#como-funciona" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Preguntas frecuentes", href: "/#faq" },
      { label: "Contacto", href: "mailto:hola@leadscout.app" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-bg-2">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="font-serif text-lg font-semibold">LeadScout</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-2">
              Encuentra clientes potenciales para tu negocio automáticamente. Pega tu URL y listo.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-ink-2">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-2/80 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line/60 pt-6 text-xs text-ink-2/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LeadScout. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
