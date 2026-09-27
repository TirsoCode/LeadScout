"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/icons";

export function SiteHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="LeadScout — inicio">
          <Logo />
          <span className="font-serif text-xl font-semibold tracking-tight">LeadScout</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push("/?auth=login")}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink sm:px-4"
          >
            Sign in
          </button>
          <button type="button" onClick={() => router.push("/?auth=signup")} className="btn-accent !px-4 !py-2">
            Sign up
          </button>
        </nav>
      </div>
    </header>
  );
}
