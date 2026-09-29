import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { LeadDetail } from "@/components/results/lead-detail";
import { getCurrentUser } from "@/lib/auth";
import { countMessagesThisWeek, getLeadForUser, getMessagesForUser, getSearchById } from "@/lib/db";
import { FREE_WEEKLY_MESSAGE_LIMIT } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "LeadScout" },
  description: "El post original, por qué es un lead y el mensaje para contactar.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Ficha de un lead: el post entero, el motivo del match y el mensaje.
 *
 * Solo existe para quien tiene sesión Y el lead es suyo. Se resuelve con
 * `getLeadForUser`, que nunca busca por `leadId` en la tabla entera sino dentro
 * de las búsquedas del usuario: un lead ajeno cae en `notFound()` en lugar de
 * un 403 que confirmaría que ese id existe.
 *
 * El anónimo no tiene preview aquí (la cookie de preview ata un `searchId`, no
 * un `leadId`): si no hay sesión, se manda a crear la cuenta con `next` para
 * volver a la ficha si al final resultara suya.
 */
export default async function LeadPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth?mode=signup&next=${encodeURIComponent(`/lead/${params.id}`)}`);
  }

  const lead = await getLeadForUser(user.id, params.id);
  if (!lead) notFound();

  // El "atrás" lleva a la búsqueda de la que salió el lead, no al dashboard en
  // general: el contexto de la ficha es la búsqueda.
  const search = await getSearchById(lead.searchId).catch(() => null);
  const backHref = search ? `/resultados/${search.id}` : "/dashboard";

  const [messages, used] = await Promise.all([
    getMessagesForUser(user.id).catch(() => []),
    countMessagesThisWeek(user.id).catch(() => 0),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader userEmail={user.email} />

      <main className="container-page flex-1 py-10">
        <LeadDetail
          lead={lead}
          businessName={search?.business.businessName ?? "tu negocio"}
          backHref={backHref}
          quota={{ used, limit: FREE_WEEKLY_MESSAGE_LIMIT, remaining: null }}
          existingMessage={messages.find((message) => message.leadId === lead.id)}
        />
      </main>

      <footer className="border-t border-line/70 py-8">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 text-xs text-ink-2/70">
          <p>LeadScout</p>
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Ir a todos tus leads
          </Link>
        </div>
      </footer>
    </div>
  );
}
