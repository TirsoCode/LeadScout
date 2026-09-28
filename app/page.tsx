import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroCopy, ScanExperience } from "@/components/landing/scan-experience";
import { Faq, HowItWorks, MessageTeaser, Pricing, Stats } from "@/components/landing/sections";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  // `absolute` porque el layout define el template "%s · LeadScout": con un
  // string normal la pestaña se queda en "LeadScout · LeadScout".
  title: { absolute: "LeadScout" },
  description:
    "Pega la URL de tu negocio y la IA encuentra en LinkedIn y Reddit a personas que necesitan tu servicio, con porcentaje de afinidad incluido.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { auth?: string; err?: string };
}) {
  // Compatibilidad con los enlaces viejos `/?auth=signup|login&err=...`:
  // la autenticación ya vive en su propia pantalla, así que solo redirigimos.
  const { auth, err } = searchParams;
  if (auth === "signup" || auth === "login" || err) {
    const params = new URLSearchParams();
    params.set("mode", auth === "signup" ? "signup" : "login");
    if (err) params.set("err", err);
    redirect(`/auth?${params.toString()}`);
  }

  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero: fondo verde oscuro liso, sin gradientes (SPEC.md) */}
        <section id="top" className="border-b border-line/60">
          <div className="container-page flex min-h-[calc(100vh-4rem)] flex-col justify-center py-16 sm:py-20">
            <div className="flex flex-col items-center gap-10">
              <HeroCopy />
              <ScanExperience signedIn={Boolean(user)} />
            </div>

            <div className="mt-16 border-t border-line/50 pt-10">
              <Stats />
            </div>
          </div>
        </section>

        <HowItWorks />
        <MessageTeaser />
        <Pricing />
        <Faq />
      </main>

      <SiteFooter />
    </div>
  );
}
