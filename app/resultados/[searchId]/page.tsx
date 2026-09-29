import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ResultsScreen } from "@/components/results/results-screen";
import { getCurrentUser, getPreviewSearchId } from "@/lib/auth";
import { countMessagesThisWeek, getLeadsForSearch, getMessagesForUser, getSearchById } from "@/lib/db";
import { maskLead } from "@/lib/mask";
import { FREE_WEEKLY_MESSAGE_LIMIT } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "Tus resultados · LeadScout" },
  description: "Los leads encontrados para tu web, con su porcentaje de afinidad.",
  // La página es por búsqueda y muestra una preview bloqueada: no tiene sentido
  // en un índice de búsqueda, ni con sesión ni sin ella.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Pantalla de resultados, en su propia ruta.
 *
 * Antes los leads se pintaban dentro del hero de la landing. Ahora es una
 * página aparte: la landing es la entrada y aquí es donde se trabaja la lista.
 *
 * Quién puede verla, y por qué:
 *  - Con sesión y la búsqueda es suya -> leads COMPLETOS.
 *  - Sin sesión, pero es la búsqueda que tiene en la cookie de preview ->
 *    leads ENMASCARADOS (`lib/mask.ts`). La cookie es httpOnly y firmada, así
 *    que no se puede forjar para ver leads ajenos.
 *  - Cualquier otra combinación -> 404. No revelamos ni si la búsqueda existe.
 */
export default async function ResultsPage({
  params,
}: {
  params: { searchId: string };
}) {
  const user = await getCurrentUser();
  const search = await getSearchById(params.searchId);

  if (!search) notFound();

  const owns = Boolean(user && search.userId === user.id);
  const isOwnPreview = !owns && search.userId === null && getPreviewSearchId() === search.id;

  if (!owns && !isOwnPreview) notFound();

  const [leads, messages, used] = await Promise.all([
    getLeadsForSearch(search.id),
    user ? getMessagesForUser(user.id).catch(() => []) : Promise.resolve([]),
    user ? countMessagesThisWeek(user.id).catch(() => 0) : Promise.resolve(0),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader userEmail={user?.email} />

      <main className="container-page flex-1 py-10">
        <ResultsScreen
          business={search.business}
          leads={owns ? leads : leads.map(maskLead)}
          total={leads.length}
          live={search.live}
          unlocked={owns}
          quota={{ used, limit: FREE_WEEKLY_MESSAGE_LIMIT, remaining: null }}
          initialMessages={messages}
          backHref="/"
        />
      </main>

      <footer className="border-t border-line/70 py-8">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 text-xs text-ink-2/70">
          <p>LeadScout</p>
          <Link href="/" className="transition-colors hover:text-accent">
            Analizar otra web
          </Link>
        </div>
      </footer>
    </div>
  );
}
