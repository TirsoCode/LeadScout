import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  // `absolute` porque el layout define el template "%s · LeadScout": con un
  // string normal la pestaña se queda en "LeadScout · LeadScout".
  title: { absolute: "LeadScout" },
  description: "Inicia sesión o crea tu cuenta para desbloquear tus leads completos.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AuthSearchParams = { mode?: string; err?: string; next?: string };

export default async function AuthPage({ searchParams }: { searchParams: AuthSearchParams }) {
  // Con sesión no hay nada que pedir: directo al dashboard.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const mode = searchParams.mode === "login" ? "login" : "signup";
  const next = typeof searchParams.next === "string" ? searchParams.next : null;
  // El mensaje viene de la URL: lo acotamos por prudencia antes de pintarlo.
  const error = typeof searchParams.err === "string" ? searchParams.err.slice(0, 300) : null;

  return <AuthScreen mode={mode} initialError={error} next={next} />;
}
