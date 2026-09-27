/**
 * Autenticación.
 *
 * Dos modos, elegidos automáticamente por variables de entorno:
 *
 *  - Supabase (si hay NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY):
 *    email/password y OAuth (Google) con cookies de @supabase/ssr.
 *  - Local (sin variables): email + password con scrypt, y una cookie firmada
 *    en HMAC. Es un modo de desarrollo: suficiente para recorrer todo el
 *    producto en localhost:3000 sin montar nada externo.
 *
 * `getCurrentUser()` es la única puerta de entrada para el resto del código.
 */

import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User } from "./types";
import { getSecret } from "./secret";

export const SESSION_COOKIE = "leadscout_session";
export const PREVIEW_COOKIE = "leadscout_preview";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export function usingSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// --- passwords (solo modo local) -------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const derived = scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, "hex");
  if (derived.length !== expectedBuf.length) return false;
  return timingSafeEqual(derived, expectedBuf);
}

// --- cookie firmada (solo modo local) ---------------------------------------

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function pack(payload: string): string {
  return `${payload}.${sign(payload)}`;
}

function unpack(token: string | undefined): string | null {
  if (!token) return null;
  const index = token.lastIndexOf(".");
  if (index <= 0) return null;
  const payload = token.slice(0, index);
  const signature = token.slice(index + 1);
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return payload;
}

export function setSessionCookie(userId: string): void {
  cookies().set(SESSION_COOKIE, pack(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function setPreviewCookie(searchId: string): void {
  cookies().set(PREVIEW_COOKIE, pack(searchId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function getPreviewSearchId(): string | null {
  return unpack(cookies().get(PREVIEW_COOKIE)?.value);
}

export function clearPreviewCookie(): void {
  cookies().set(PREVIEW_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// --- Supabase (opcional) ----------------------------------------------------

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

async function getSupabaseServer() {
  const { createServerClient } = await import("@supabase/ssr");
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items: CookieToSet[]) => {
          try {
            for (const { name, value, options } of items) {
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            }
          } catch {
            // Server Components no pueden escribir cookies: se ignora.
            // El refresh por middleware se encarga de esto.
          }
        },
      },
    },
  );
}

/**
 * Usuario de la petición actual, o null. Nunca lanza: si el modo Supabase está
 * mal configurado se comporta como "sin sesión" y el resto de la app sigue.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (usingSupabase()) {
    try {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.email) return null;
      return {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at ?? new Date().toISOString(),
      };
    } catch (err) {
      console.error("[auth] supabase:", err);
      return null;
    }
  }

  const userId = unpack(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const { findUserById } = await import("./db");
  const user = await findUserById(userId);
  if (!user) return null;

  // Nunca devolvemos el hash de la contraseña hacia fuera: `getCurrentUser` es
  // la función que usan las rutas y los Server Components, así que el objeto
  // acabaría serializado en el HTML o en un JSON.
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}
