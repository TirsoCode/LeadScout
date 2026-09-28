import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroCopy, ScanExperience } from "@/components/landing/scan-experience";
import { Faq, HowItWorks, MessageTeaser, Pricing, Stats } from "@/components/landing/sections";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  // Solo el nombre de la marca: es lo que se lee en la pestaña de Chrome. Un
  // `title` en string de la página sustituye al del layout y no hereda su
  // `template`, así que aquí se escribe el valor final tal cual.
  title: "LeadScout",
  description:
    "Pega la URL de tu negocio y la IA encuentra en LinkedIn y Reddit a personas que necesitan tu servicio, con porcentaje de afinidad incluido.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
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
              {/* Suspense: ScanExperience usa useSearchParams para abrir el
                  modal cuando la navbar navega a /?auth=signup. */}
              <Suspense fallback={<div className="mx-auto h-24 w-full max-w-2xl" />}>
                <ScanExperience signedIn={Boolean(user)} />
              </Suspense>
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
