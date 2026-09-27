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

  const credentials = mode === "signup" ? { email, password } : { email, password };
  const { data, error } = mode === "signup"
    ? await supabase.auth.signUp(credentials)
    : await supabase.auth.signInWithPassword(credentials);

  if (error) return { error: error.message };
  if (!data.user?.email) return { error: "No se pudo completar el registro." };

  const user: User = {
    id: data.user.id,
    email: data.user.email,
    createdAt: data.user.created_at ?? new Date().toISOString(),
  };
  return { user };
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

  if (mode === "signup") {
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email. Prueba a iniciar sesión." },
        { status: 409 },
      );
    }
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
    return NextResponse.json(
      { error: "No encontramos una cuenta con ese email." },
      { status: 401 },
    );
  }
  if (!verifyPassword(password, existing.passwordHash)) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  setSessionCookie(existing.id);
  await claimPreviewForUser(existing.id, getPreviewSearchId());
  clearPreviewCookie();
  return NextResponse.json({ user: { id: existing.id, email: existing.email, createdAt: existing.createdAt } });
}
