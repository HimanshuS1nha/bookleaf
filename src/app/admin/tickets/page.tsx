import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminTicketsView } from "@/components/admin/admin-tickets-view";
import { TicketsSkeleton } from "@/components/tickets/ticket-filter-controls";

export const metadata: Metadata = {
  title: "Tickets · Bookleaf Admin",
  robots: { index: false, follow: false },
};

export default function AdminTicketsPage() {
  return (
    <>
      <h1 className="font-serif text-3xl font-medium tracking-tight">
        Ticket queue
      </h1>
      <p className="mt-2 text-muted-foreground">
        Critical tickets are pinned to the top. Everything else is shown oldest
        first.
      </p>

      <div className="mt-8">
        {/* useSearchParams in AdminTicketsView needs a Suspense boundary */}
        <Suspense fallback={<TicketsSkeleton />}>
          <AdminTicketsView />
        </Suspense>
      </div>
    </>
  );
}
