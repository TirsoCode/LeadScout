import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScanExperience } from "@/components/landing/scan-experience";
import {
  HowItWorks,
  MessagePreview,
  MessageTeaser,
  Pricing,
  Stats,
} from "@/components/landing/sections";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  // `absolute` porque el layout define el template "%s · LeadScout": con un
  // string normal la pestaña se queda en "LeadScout · LeadScout".
  title: { absolute: "LeadScout" },
  description:
    "Pega la URL de tu negocio y la IA encuentra en Reddit a personas que necesitan tu servicio, con porcentaje de afinidad incluido.",
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
      <SiteHeader userEmail={user?.email} />

      <main className="flex-1">
        {/* El hero lo monta `ScanExperience` porque su estado decide la
            disposición: en reposo son dos columnas (promesa + buscador a la
            izquierda, tarjeta a la derecha) y durante el scan una pantalla
            de análisis a página completa. La tarjeta y la nota de datos
            entran como contenido de servidor. */}
        <section id="top" className="border-b border-line/60">
          <ScanExperience preview={<MessagePreview />} footer={<Stats />} />
        </section>

        <HowItWorks />
        <MessageTeaser />
        <Pricing />
      </main>

      <SiteFooter />
    </div>
  );
}
