import type { Metadata } from "next";

import { TicketDetail } from "@/components/dashboard/ticket-detail";

import { getDashboardAuthor } from "@/helpers/dashboard.helper";

export const metadata: Metadata = {
  title: "Ticket · Bookleaf",
};

export default async function TicketPage({
  params,
}: PageProps<"/dashboard/tickets/[ticketId]">) {
  const [author, { ticketId }] = await Promise.all([
    getDashboardAuthor(),
    params,
  ]);

  return <TicketDetail authorId={author.id} ticketId={ticketId} />;
}
