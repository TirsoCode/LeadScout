/**
 * Secreto de firma para las cookies del modo local.
 *
 * Se genera una vez y se guarda en `.data/secret` (ignorado por git) para que
 * las sesiones sobrevivan a los reinicios de `next dev`. En producción con
 * Supabase no se usa, pero sigue siendo un buen valor por defecto seguro.
 */

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

let cached: string | null = null;

export function getSecret(): string {
  if (cached) return cached;

  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    cached = fromEnv;
    return cached;
  }

  const path = join(process.cwd(), ".data", "secret");
  try {
    if (existsSync(path)) {
      cached = readFileSync(path, "utf8").trim();
      if (cached) return cached;
    }
    const generated = randomBytes(32).toString("hex");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, generated, "utf8");
    cached = generated;
    return cached;
  } catch {
    // Sistema de archivos no escribible (p.ej. serverless read-only): usamos
    // un secreto efímero. Las sesiones durarán lo que dure el proceso.
    cached = randomBytes(32).toString("hex");
    return cached;
  }
}
