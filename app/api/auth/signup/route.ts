/**
 * POST /api/auth/signup — registro (email + password) o login, según el campo
 * `mode`. Con Supabase configurado delega en Supabase; sin él usa el store
 * local. En ambos casos reclama la búsqueda anónima de la cookie de preview.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createLocalUser, claimPreviewForUser, findUserByEmail } from "@/lib/db";
import {
  clearPreviewCookie,
  getPreviewSearchId,
  hashPassword,
  setSessionCookie,
  usingSupabase,
  verifyPassword,
} from "@/lib/auth";
import { randomId } from "@/lib/utils";
import type { User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Body = { mode?: string; email?: unknown; password?: unknown; fullName?: unknown };

/**
 * Supabase contesta en inglés; la UI es en español y los tests comprueban los
 * textos en español. Traducimos los casos que el usuario puede provocar de
 * verdad y, para lo demás, un mensaje genérico (el original solo al log).
 */
function friendlyAuthError(error: { code?: string; message: string }): string {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (code === "user_already_exists" || message.includes("already been registered") || message.includes("already registered")) {
    return "Ya existe una cuenta con ese email. Prueba a iniciar sesión.";
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "No encontramos una cuenta con ese email o la contraseña es incorrecta.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Confirma tu email antes de iniciar sesión.";
  }
  if (code === "weak_password" || message.includes("password should be")) {
    return "La contraseña necesita al menos 8 caracteres.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Demasiados intentos. Espera un momento.";
  }

  console.warn("[auth] supabase:", error.code ?? "", error.message);
  return "No se pudo completar la autenticación.";
}

async function withSupabase(mode: "signup" | "login", email: string, password: string) {
  const { createServerClient } = await import("@supabase/ssr");
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          }
        },
      },
    },
  );

  // Gracia del registro ciego (SPEC.md): "crear cuenta" con un email que ya
  // existe inicia sesión, y "iniciar sesión" con un email nuevo crea la cuenta.
  // Solo falla si la contraseña no encaja en ningún caso.
  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user?.email) {
      return { user: { id: data.user.id, email: data.user.email, createdAt: data.user.created_at ?? new Date().toISOString() } };
    }
    // Si ya existe una cuenta, el signUp devuelve error: intentamos el login.
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (!loginError && loginData.user?.email) {
      return { user: { id: loginData.user.id, email: loginData.user.email, createdAt: loginData.user.created_at ?? new Date().toISOString() } };
    }
    // La contraseña tampoco vale para la cuenta existente.
    return { error: friendlyAuthError({ code: loginError?.code ?? error?.code, message: loginError?.message ?? error?.message ?? "No se pudo completar la autenticación." }) };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error && data.user?.email) {
    return { user: { id: data.user.id, email: data.user.email, createdAt: data.user.created_at ?? new Date().toISOString() } };
  }
  // No existe la cuenta o la contraseña es mala: probamos a crearla.
  const { data: signupData, error: signupError } = await supabase.auth.signUp({ email, password });
  if (!signupError && signupData.user?.email) {
    return { user: { id: signupData.user.id, email: signupData.user.email, createdAt: signupData.user.created_at ?? new Date().toISOString() } };
  }
  return { error: friendlyAuthError({ code: signupError?.code ?? error?.code, message: signupError?.message ?? error?.message ?? "No se pudo iniciar sesión." }) };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const mode = body.mode === "login" ? "login" : "signup";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña necesita al menos 8 caracteres." },
      { status: 400 },
    );
  }

  if (usingSupabase()) {
    const result = await withSupabase(mode, email, password);
    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error ?? "No se pudo iniciar sesión." },
        { status: 401 },
      );
    }
    const { upsertSupabaseUser } = await import("@/lib/db");
    await upsertSupabaseUser(result.user.id, result.user.email);
    await claimPreviewForUser(result.user.id, getPreviewSearchId());
    clearPreviewCookie();
    return NextResponse.json({ user: result.user });
  }

  // --- modo local ---
  const existing = await findUserByEmail(email);

  if (mode === "signup" && existing) {
    // "Crear cuenta" con un email que ya existe: si la contraseña encaja,
    // inicia sesión (gracia del registro ciego).
    if (existing.passwordHash && verifyPassword(password, existing.passwordHash)) {
      setSessionCookie(existing.id);
      await claimPreviewForUser(existing.id, getPreviewSearchId());
      clearPreviewCookie();
      return NextResponse.json({ user: { id: existing.id, email: existing.email, createdAt: existing.createdAt } });
    }
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email o la contraseña es incorrecta." },
      { status: 401 },
    );
  }

  if (mode === "signup") {
    const user: User & { passwordHash: string } = {
      id: randomId("usr"),
      email,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
    };
    await createLocalUser(user);
    setSessionCookie(user.id);
    await claimPreviewForUser(user.id, getPreviewSearchId());
    clearPreviewCookie();
    const { passwordHash: _ignored, ...safe } = user;
    return NextResponse.json({ user: safe });
  }

  if (!existing?.passwordHash) {
    // "Iniciar sesión" con un email que no existe: crea la cuenta.
    const user: User & { passwordHash: string } = {
      id: randomId("usr"),
      email,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
    };
    await createLocalUser(user);
    setSessionCookie(user.id);
    await claimPreviewForUser(user.id, getPreviewSearchId());
    clearPreviewCookie();
    const { passwordHash: _ignored, ...safe } = user;
    return NextResponse.json({ user: safe });
  }
  if (!verifyPassword(password, existing.passwordHash)) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  setSessionCookie(existing.id);
  await claimPreviewForUser(existing.id, getPreviewSearchId());
  clearPreviewCookie();
  return NextResponse.json({ user: { id: existing.id, email: existing.email, createdAt: existing.createdAt } });
}
