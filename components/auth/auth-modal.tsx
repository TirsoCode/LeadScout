"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiErrorResponse } from "@/lib/api";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { IconClose, IconGoogle, IconSpinner } from "@/components/icons";

type Mode = "signup" | "login";

/**
 * Modal de registro/login (paso 5 del flujo). Tras Autenticarse, si veníamos de
 * una preview con leads, el servidor ya ha vinculado esa búsqueda al usuario:
 * solo hay que recargar y los leads aparecen desbloqueados.
 */
export function AuthModal({
  open,
  mode: initialMode,
  initialError = null,
  onClose,
  onSuccess,
}: {
  open: boolean;
  mode: Mode;
  /** Error que viene de la URL tras un OAuth fallido. */
  initialError?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMode(initialMode), [initialMode]);

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Bloqueamos el scroll de fondo mientras el modal está abierto.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await api.auth(mode, email, password);
      onSuccess?.();
      // `refresh()` actualiza la cookie en el servidor antes de navegar; sin
      // esto el dashboard podría pintarse sin sesión.
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiErrorResponse ? err.message : "No se pudo completar la operación.");
      setPending(false);
    }
  }

  /** Login con Google vía Supabase OAuth (PKCE). */
  async function handleGoogle() {
    setError(null);
    setPending(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError(
        "El acceso con Google necesita las credenciales de Supabase (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY).",
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="card w-full max-w-md animate-fade-up p-6 shadow-glow sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-2 transition-colors hover:bg-bg-2 hover:text-ink"
        >
          <IconClose />
        </button>

        <h2 id="auth-title" className="font-serif text-2xl font-semibold">
          {mode === "signup" ? "Desbloquea tus leads" : "Entra en tu cuenta"}
        </h2>
        <p className="mt-1.5 text-sm text-ink-2">
          {mode === "signup"
            ? "Gratis, sin tarjeta. Tus leads están esperándote."
            : "Bienvenido de vuelta."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* El botón de Google se muestra siempre, tenga o no Supabase
              configurado. Si faltan las credenciales, `handleGoogle` lo explica
              en vez de dejar un botón que no hace nada. */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={pending}
            className="btn w-full !border-line !bg-white !text-[#1f1f1f] hover:!bg-[#f1f1f1]"
          >
            <IconGoogle className="h-4 w-4" />
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-wider text-ink-2/70">o con email</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div>
            <label htmlFor="auth-email" className="label">
              Email
            </label>
            <input
              ref={inputRef}
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="label">
              Contraseña
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className="btn-accent w-full">
            {pending ? <IconSpinner className="h-4 w-4" /> : null}
            {mode === "signup" ? "Crear cuenta gratis" : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-2">
          {mode === "signup" ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError(null);
            }}
            className="font-semibold text-accent hover:underline"
          >
            {mode === "signup" ? "Inicia sesión" : "Regístrate gratis"}
          </button>
        </p>

        {mode === "signup" ? (
          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-2/60">
            Leads y búsquedas ilimitados en el plan gratis. 3 mensajes de IA por semana.
          </p>
        ) : null}
      </div>
    </div>
  );
}
