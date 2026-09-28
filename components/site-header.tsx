"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconPaperPlane, IconLogout, Logo } from "@/components/icons";
import { api } from "@/lib/api";

export function SiteHeader({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();

  async function handleLogout() {
    await api.logout().catch(() => undefined);
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="LeadScout — inicio">
          <Logo />
          <span className="font-serif text-xl font-semibold tracking-tight">LeadScout</span>
        </Link>

        {userEmail ? (
          <nav className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[160px] truncate text-sm text-ink-2 md:block">
              {userEmail}
            </span>
            <Link href="/dashboard" className="btn-accent !px-4 !py-2">
              <IconPaperPlane className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
              aria-label="Cerrar sesión"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.push("/auth?mode=login")}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink sm:px-4"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => router.push("/auth?mode=signup")}
              className="btn-accent !px-4 !py-2"
            >
              <IconPaperPlane className="h-4 w-4" />
              Crear cuenta
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}