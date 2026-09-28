import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, usingSupabase } from "@/lib/auth";
import {
  countMessagesThisWeek,
  getLeadsForUser,
  getMessagesForUser,
  getSearchesForUser,
} from "@/lib/db";
import { FREE_WEEKLY_MESSAGE_LIMIT } from "@/lib/types";
import { DashboardClient, type SearchSummary } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  // Igual que en la landing: solo la marca, que es lo que se ve en la pestaña.
  title: "LeadScout",
  description: "Tus leads desbloqueados y el generador de mensajes.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/?auth=login");

  const [searches, leads, messages, used] = await Promise.all([
    getSearchesForUser(user.id),
    getLeadsForUser(user.id),
    getMessagesForUser(user.id),
    countMessagesThisWeek(user.id).catch(() => 0),
  ]);

  const summaries: SearchSummary[] = searches.map((search) => {
    const searchLeads = leads.filter((lead) => lead.searchId === search.id);
    return {
      id: search.id,
      url: search.url,
      live: search.live,
      createdAt: search.createdAt,
      businessName: search.business.businessName,
      service: search.business.service,
      leadCount: searchLeads.length,
      topScore: searchLeads.reduce((max, lead) => Math.max(max, lead.matchScore), 0),
    };
  });

  return (
    <DashboardClient
      userEmail={user.email}
      mode={usingSupabase() ? "supabase" : "local"}
      initialLeads={leads}
      initialSearches={summaries}
      initialMessages={messages}
      initialQuota={{
        used,
        limit: FREE_WEEKLY_MESSAGE_LIMIT,
        remaining: Math.max(0, FREE_WEEKLY_MESSAGE_LIMIT - used),
      }}
    />
  );
}
