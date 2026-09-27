/**
 * Enmascarado de leads para la preview anónima.
 *
 * El efecto pixelado del SPEC.md es CSS, pero el blur del navegador no es una
 * medida de seguridad: el HTML completo seguiría en la respuesta de red. Aquí
 * los usuarios NO registrados reciben los datos ya recortados en el servidor,
 * de forma que los leads reales no salen nunca de nuestra base de datos hasta
 * que hay sesión. El CSS solo pone la finishing touch visual.
 *
 * Lo que sí viaja en claro (SPEC.md): % de afinidad, plataforma y comunidad.
 */

export type MaskedLead = {
  id: string;
  platform: "reddit" | "linkedin";
  community?: string;
  matchScore: number;
  nameMasked: string;
  titleMasked: string;
  snippetMasked: string;
  reasonMasked: string;
  createdAt: string;
};

/** Deja la primera letra de cada palabra: el patrón de "primera letra + puntos". */
function initialsMask(value: string): string {
  const words = value.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•••••";
  return words
    .slice(0, 3)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${"•".repeat(Math.min(word.length - 1, 6))}`)
    .join(" ");
}

/** Deja solo la primera frase, con la mitad de las palabras tapadas. */
function snippetMask(value: string): string {
  const firstSentence = value.split(/(?<=[.!?])\s/)[0] ?? value;
  const words = firstSentence.split(/\s+/);
  return words
    .slice(0, 14)
    .map((word, index) => (index % 2 === 1 ? "•••" : word))
    .join(" ")
    .concat(words.length > 14 ? " •••" : "");
}

export function maskLead(lead: {
  id: string;
  platform: "reddit" | "linkedin";
  community?: string;
  matchScore: number;
  name: string;
  title: string;
  snippet: string;
  reason: string;
  createdAt: string;
}): MaskedLead {
  return {
    id: lead.id,
    platform: lead.platform,
    community: lead.community,
    matchScore: lead.matchScore,
    nameMasked: initialsMask(lead.name),
    titleMasked: initialsMask(lead.title),
    snippetMasked: snippetMask(lead.snippet),
    reasonMasked: initialsMask(lead.reason),
    createdAt: lead.createdAt,
  };
}
