#!/usr/bin/env node
/**
 * Escribe `.env.local` con las claves del proyecto de Supabase ENLAZADO.
 *
 * Por qué existe: la `service_role` es un secreto de servidor y no se puede
 * dejar en el repo ni en un archivo de ejemplo. Este script la pide a la CLI
 * (que ya tiene tu sesión iniciada) y la escribe solo en `.env.local`, que
 * está en `.gitignore` y se crea con permisos 600.
 *
 *   supabase link --project-ref <ref>     # una vez
 *   npm run supabase:setup                # cada vez que roten las claves
 *   npm run supabase:setup -- --force     # pisa un .env.local existente
 *
 * No imprime las claves: solo las primeras y últimas letras.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, chmodSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const refFile = join(root, "supabase", ".temp", "project-ref");
const envFile = join(root, ".env.local");
const force = process.argv.includes("--force");

if (!existsSync(refFile)) {
  console.error("No hay proyecto enlazado. Ejecuta primero:");
  console.error("  supabase link --project-ref <tu-ref>");
  process.exit(1);
}
const ref = readFileSync(refFile, "utf8").trim();

if (existsSync(envFile) && !force) {
  console.error(`.env.local ya existe (modo ${(statSync(envFile).mode & 0o777).toString(8)}).`);
  console.error("Si quieres regenerarlo: npm run supabase:setup -- --force");
  process.exit(1);
}

const raw = execFileSync("supabase", ["projects", "api-keys", "--project-ref", ref, "-o", "json"], {
  encoding: "utf8",
});
const start = raw.indexOf("[");
if (start < 0) {
  console.error("No se pudo leer la respuesta de la CLI de Supabase.");
  process.exit(1);
}

const keys = new Map();
for (const entry of JSON.parse(raw.slice(start))) {
  keys.set(entry.name, entry.api_key ?? entry.value ?? "");
}

const anon = keys.get("anon");
const service = keys.get("service_role");
if (!anon || !service) {
  console.error("La CLI no devolvió las claves `anon` y `service_role`.");
  process.exit(1);
}

const contents = `# Generado por scripts/setup-supabase.mjs (npm run supabase:setup). NO SUBIR.
# Proyecto Supabase: ${ref}
# La service_role es un secreto de servidor: este archivo está en .gitignore.

NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
SUPABASE_SERVICE_ROLE_KEY=${service}
`;

writeFileSync(envFile, contents, { encoding: "utf8", mode: 0o600 });
chmodSync(envFile, 0o600);

const mask = (value) => `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`;
console.log(`✓ .env.local escrito (600) para el proyecto ${ref}`);
console.log(`  NEXT_PUBLIC_SUPABASE_URL    : https://${ref}.supabase.co`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${mask(anon)}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY    : ${mask(service)}`);
console.log("");
console.log("Siguientes pasos:");
console.log("  1. supabase db push --linked   # crea users/searches/leads/messages");
console.log("  2. reinicia el servidor        # sin esto sigue en modo local");
