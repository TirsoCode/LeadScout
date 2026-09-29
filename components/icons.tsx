/**
 * Iconos en SVG inline. Sin librerías de iconos: son pocos y controlamos el
 * tamaño y el `currentColor` desde Tailwind.
 */

type IconProps = { className?: string };

export function IconTarget({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconLock({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

export function IconArrow({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSparkle({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
      <path d="M19 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" opacity=".7" />
    </svg>
  );
}

/**
 * Marca de IA: chip con un destello dentro. Sustituye a la frase larga que
 * estaba en el pie ("Hecho con IA"): ahora lo dice el icono, no el texto.
 */
export function IconAI({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" />
      <path
        d="M12 8.3l1.15 2.55L15.7 12l-2.55 1.15L12 15.7l-1.15-2.55L8.3 12l2.55-1.15L12 8.3z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M9.5 4.5V3M14.5 4.5V3M9.5 19.5V21M14.5 19.5V21" strokeLinecap="round" />
    </svg>
  );
}

export function IconGlobe({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18-2.5-2.7-2.5-15.3 0-18z" />
    </svg>
  );
}

export function IconUser({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}

export function IconCopy({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
    </svg>
  );
}

export function IconClose({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconSpinner({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

/** Enlace externo: flecha que sale de un recuadro. */
export function IconExternal({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4l-9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" strokeLinecap="round" />
    </svg>
  );
}

/** Actualizar / buscar más: flecha circular. */
export function IconRefresh({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
    </svg>
  );
}

export function IconMessage({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20.5 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.4-5.4A7.5 7.5 0 1 1 20.5 12z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLogout({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
      <path d="M10 12h10m0 0l-3-3m3 3l-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mostrar/ocultar contraseña en la pantalla de acceso. */
export function IconEye({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2.5 12S6.3 5.5 12 5.5 21.5 12 21.5 12 17.7 18.5 12 18.5 2.5 12 2.5 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c5.7 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4M6.4 7.6A16.8 16.8 0 0 0 2.5 12S6.3 18.5 12 18.5c1.5 0 2.8-.4 4-1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10a3 3 0 0 0 4.2 4.2" strokeLinecap="round" />
      <path d="M4 4l16 16" strokeLinecap="round" />
    </svg>
  );
}

export function IconGoogle({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z" />
    </svg>
  );
}

/** Logo de LeadScout: una diana + "scout". */
export function Logo({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#16a34a" />
      <circle cx="14.5" cy="16" r="7" stroke="#ffffff" strokeWidth="2.2" />
      <path d="M19.6 20.2L26 26" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="14.5" cy="16" r="2.4" fill="#ffffff" />
    </svg>
  );
}

/** Marca de plataforma. Reddit no tiene logo oficial en SVG: lo estilizamos. */
export function IconReddit({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5A9.5 9.5 0 0 0 4.3 5.8l.5 2.2A7.7 7.7 0 0 0 2.2 12c0 1.3.3 2.5.9 3.6l-1 3.6 4-1.9c1.2.5 2.5.8 3.9.8a6.6 6.6 0 0 0 1.3-.1A5.6 5.6 0 0 1 10 13.4c0-2.3 2.3-4.2 5.2-4.2.5 0 1 .1 1.5.2a5.9 5.9 0 0 1 3.4-.4l.5-2.4A9.5 9.5 0 0 0 12 2.5zm-3.1 6.3a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm6.2 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z" />
      <path d="M7.6 13.2c0 2.4 3 4.3 6.7 4.3s6.7-1.9 6.7-4.3c0-.3-.1-.7-.2-1l-1.6.6a4.2 4.2 0 0 0-1.5-.3c-.6 0-1.2.1-1.7.3a5.9 5.9 0 0 0-5.4 0 4.2 4.2 0 0 0-1.7-.3c-.5 0-1 .1-1.5.3l-1.6-.6c-.1.3-.2.7-.2 1z" fill="#ffffff" />
    </svg>
  );
}

export function IconPaperPlane({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

/** Estrella de favorito. `filled` la pinta de relleno. */
export function IconStar({
  className = "h-4 w-4",
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5z" />
    </svg>
  );
}

/** Descargar / exportar a CSV. */
export function IconDownload({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5" />
      <path d="M4.5 18.5v1a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-1" />
    </svg>
  );
}

/** Compartir. */
export function IconShare({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
    </svg>
  );
}

/** WhatsApp: la marca oficial, en su verde. */
export function IconWhatsapp({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2A9.9 9.9 0 002.1 11.9c0 1.75.46 3.45 1.34 4.95L2 22l5.3-1.38a9.9 9.9 0 004.74 1.2h.01a9.9 9.9 0 009.94-9.9A9.9 9.9 0 0012.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.2 8.2 0 01-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 018.24 8.25c0 4.54-3.7 8.22-8.24 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.06s.88 2.39 1 2.56c.13.16 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z" />
    </svg>
  );
}

/** X (antes Twitter), en negro. */
export function IconXSocial({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.53 3h3.02l-6.6 7.55L21.75 21h-5.9l-4.63-6.05L5.94 21H2.92l7.06-8.08L2.5 3h6.05l4.18 5.52L17.53 3zm-1.06 16.2h1.67L7.6 4.7H5.81l10.66 14.5z" />
    </svg>
  );
}

/** LinkedIn, en su azul. */
export function IconLinkedin({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9.5h4v11H3v-11zm6.5 0h3.83v1.5h.05c.53-.95 1.84-1.95 3.78-1.95 4.04 0 4.79 2.5 4.79 5.76v5.69h-4v-5.05c0-1.2-.02-2.75-1.75-2.75-1.75 0-2.02 1.3-2.02 2.66v5.14h-4v-11h.32z" />
    </svg>
  );
}

/** Barras del resumen de la búsqueda. */
export function IconChart({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

/** Flechas de ordenar. */
export function IconSort({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16M7 20l-3.5-3.5M7 20l3.5-3.5" />
      <path d="M17 20V4M17 4l-3.5 3.5M17 4l3.5 3.5" />
    </svg>
  );
}

/** Reloj: la antigüedad del post. */
export function IconClock({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

/** Ojo: ver el detalle del lead. Tamaño pequeño por defecto, como el resto. */
export function IconEyeSmall({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2.5 12S6.3 5.5 12 5.5 21.5 12 21.5 12 17.7 18.5 12 18.5 2.5 12 2.5 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
