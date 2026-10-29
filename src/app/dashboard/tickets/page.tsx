import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { TicketsView } from "@/components/dashboard/tickets-view";
import { TicketsSkeleton } from "@/components/tickets/ticket-filter-controls";

import { getDashboardAuthor } from "@/helpers/dashboard.helper";

import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Tickets · Bookleaf",
};

export default async function TicketsPage() {
  const author = await getDashboardAuthor();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            Support tickets
          </h1>
          <p className="mt-2 text-muted-foreground">
            Questions you&apos;ve raised and where each one stands.
          </p>
        </div>
        <Link
          href={ROUTES.tickets.new}
          className={buttonVariants({ size: "lg", className: "h-10 px-4" })}
        >
          New ticket
        </Link>
      </div>

      <div className="mt-8">
        {/* useSearchParams in TicketsView needs a Suspense boundary */}
        <Suspense fallback={<TicketsSkeleton />}>
          <TicketsView authorId={author.id} />
        </Suspense>
      </div>
    </>
  );
}
