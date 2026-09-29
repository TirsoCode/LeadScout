"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiErrorResponse } from "@/lib/api";
import { getBrowserSupabaseAsync, googleProviderEnabled } from "@/lib/supabase/browser";
import { IconEye, IconEyeOff, IconGoogle, IconSpinner, Logo } from "@/components/icons";

type Mode = "signup" | "login";

/** Las mismas cifras que la landing: refuerzo social en el panel de marca. */
const PANEL_STATS = [
  { value: "128k+", label: "leads encontrados" },
  { value: "34", label: "nichos cubiertos" },
  { value: "9.2k", label: "usuarios registrados" },
];

/** `next` solo puede ser una ruta interna: evita redirecciones abiertas. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/**
 * Pantalla de registro/login a pantalla completa (paso 5 del flujo).
 * Izquierda: marca, promesa y cifras. Derecha: el formulario.
 * Tras autenticarse, si veníamos de una preview con leads, el servidor ya ha
 * vinculado esa búsqueda al usuario: basta con navegar al dashboard.
 */
export function AuthScreen({
  mode: initialMode,
  initialError = null,
  next = null,
}: {
  mode: Mode;
  /** Error que viene de la URL (p. ej. tras un OAuth fallido). */
  initialError?: string | null;
  /** Ruta a la que volver tras entrar. Solo interna. */
  next?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMode(initialMode), [initialMode]);

  // El email recibe el foco al entrar y al cambiar de modo.
  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  // El aviso de la URL se muestra una vez: lo quitamos de `history` para que
  // un refresco no lo repita.
  useEffect(() => {
    if (!initialError || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("err");
    const query = params.toString();
    window.history.replaceState(null, "", `/auth${query ? `?${query}` : ""}`);
  }, [initialError]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await api.auth(mode, email, password);
      // `refresh()` actualiza la cookie en el servidor antes de navegar; sin
      // esto el dashboard podría pintarse sin sesión.
      router.refresh();
      router.push(safeNext(next));
    } catch (err) {
      setError(err instanceof ApiErrorResponse ? err.message : "No se pudo completar la operación.");
      setPending(false);
    }
  }

  /** Login con Google vía Supabase OAuth (PKCE). */
  async function handleGoogle() {
    setError(null);
    setPending(true);
    // Espera al cliente (import diferido de Supabase): el primer clic no debe
    // fallar por "no disponible" mientras carga el bundle.
    const supabase = await getBrowserSupabaseAsync();
    if (!supabase) {
      setError(
        "El acceso con Google no está disponible. Usa el email y la contraseña.",
      );
      setPending(false);
      return;
    }
    // Sin este chequeo, si el proveedor está apagado en el proyecto el
    // navegador navega igual y Supabase pinta un 400 JSON en su propio
    // dominio: el usuario sale de la app sin entender nada.
    if (!(await googleProviderEnabled())) {
      setError(
        "El acceso con Google todavía no está habilitado en este proyecto. Usa el email y la contraseña.",
      );
      setPending(false);
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setPending(false);
    }
    // Sin error: el navegador navega al proveedor y no volvemos aquí.
  }

  /** Cambiar entre registro e inicio de sesión, manteniendo la URL al día. */
  function switchMode() {
    const other: Mode = mode === "signup" ? "login" : "signup";
    setMode(other);
    setError(null);
    const params = new URLSearchParams(window.location.search);
    params.set("mode", other);
    window.history.replaceState(null, "", `/auth?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ---------------- Panel de marca ---------------- */}
      <aside className="flex shrink-0 flex-col justify-between gap-10 bg-accent-dim px-6 py-7 text-white sm:px-10 lg:w-[42%] lg:max-w-[600px] lg:gap-16 lg:px-14 lg:py-12">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="LeadScout — inicio">
          <Logo />
          <span className="font-serif text-xl font-semibold tracking-tight">LeadScout</span>
        </Link>

        <div className="animate-fade-up">
          <h2 className="font-serif text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl xl:text-5xl">
            Clientes potenciales que sí que responden.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
            Pega la web de tu negocio y la IA encuentra en Reddit a quienes tienen nuevas
            necesidades y buscan proveedores ahora mismo, con su porcentaje de afinidad incluido.
          </p>
        </div>

        <div className="hidden border-t border-white/15 pt-6 lg:block">
          <dl className="grid grid-cols-3 gap-4">
            {PANEL_STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-serif text-2xl font-bold xl:text-3xl">{stat.value}</dd>
                <dt className="mt-1 text-[11px] uppercase tracking-wider text-white/60">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      {/* ---------------- Formulario ---------------- */}
      <main className="flex flex-1 items-center justify-center bg-white px-5 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {mode === "signup" ? "Crea tu cuenta" : "Bienvenido de vuelta"}
          </h1>
          <p className="mt-2 text-ink-2">
            {mode === "signup"
              ? "Gratis y sin tarjeta. Tus leads desbloqueados te esperan."
              : "Retoma donde lo dejaste."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* El botón de Google se muestra siempre, tenga o no Supabase
                configurado. Si faltan las credenciales, `handleGoogle` lo explica
                en la propia pantalla en vez de dejar un botón que no hace nada. */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={pending}
              className="btn w-full border border-line bg-white !py-3.5 !text-base !text-[#1f1f1f] hover:bg-[#f1f1f1]"
            >
              <IconGoogle className="h-5 w-5" />
              Continuar con Google
            </button>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] uppercase tracking-wider text-ink-2/70">o con email</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <div>
              <label htmlFor="auth-email" className="sr-only">
                Email
              </label>
              <input
                ref={inputRef}
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                className="input !py-3.5 !text-base"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="relative">
              <label htmlFor="auth-password" className="sr-only">
                Contraseña
              </label>
              <input
                id="auth-password"
                type={visible ? "text" : "password"}
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="input !py-3.5 !pr-12 !text-base"
                placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-2 transition-colors hover:text-ink"
              >
                {visible ? <IconEye /> : <IconEyeOff />}
              </button>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={pending} className="btn-accent w-full !py-3.5 !text-base">
              {pending ? <IconSpinner className="h-4 w-4" /> : null}
              {mode === "signup" ? "Crear cuenta gratis" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-2">
            {mode === "signup" ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-accent hover:underline"
            >
              {mode === "signup" ? "Inicia sesión" : "Regístrate gratis"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
