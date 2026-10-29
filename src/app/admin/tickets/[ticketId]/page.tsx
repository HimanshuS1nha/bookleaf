import type { Metadata } from "next";

import { AdminTicketDetail } from "@/components/admin/admin-ticket-detail";

import { getDashboardAdmin } from "@/helpers/dashboard.helper";

export const metadata: Metadata = {
  title: "Ticket · Bookleaf Admin",
  robots: { index: false, follow: false },
};

export default async function AdminTicketPage({
  params,
}: PageProps<"/admin/tickets/[ticketId]">) {
  const [admin, { ticketId }] = await Promise.all([
    getDashboardAdmin(),
    params,
  ]);

  return <AdminTicketDetail ticketId={ticketId} currentAdminId={admin.id} />;
}
