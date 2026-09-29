/**
 * Portapapeles.
 *
 * SOLO para el navegador: usa `navigator` y `document`. No lo importes desde un
 * Server Component. Vive fuera de `lib/utils.ts` porque ese módulo está
 * pensado para compartirse con el servidor.
 *
 * `navigator.clipboard` falla en contextos no seguros (http:// en un dominio
 * que no sea localhost) y cuando el permiso está denegado, así que siempre
 * hay una vía de reserva con un textarea oculto.
 */

export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined") return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Sigue: el API moderno no está disponible o el permiso está denegado.
  }

  if (typeof document === "undefined") return false;

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Descarga un fichero de texto generado en memoria (el CSV).
 * Se hace con un Blob y un ancla temporal: no hay backend implicado.
 */
export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8"): boolean {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return false;
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revocar de inmediato revoca en algunos navegadores antes de que la
    // descarga empiece, así que se espera un turno.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
