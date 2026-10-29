"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { AdminTicketWorkspace } from "@/components/admin/admin-ticket-workspace";

import { ROUTES } from "@/constants/routes";

import { adminTicketQueries } from "@/queries/admin-ticket.queries";

// Polls so the AI draft and other admins' changes show up without a refresh.
// The workspace form only follows refetches while it has no unsaved edits.
const POLL_INTERVAL_MS = 30 * 1000;

export function AdminTicketDetail({
  ticketId,
  currentAdminId,
}: {
  ticketId: string;
  currentAdminId: string;
}) {
  const { data, error, isPending } = useQuery({
    ...adminTicketQueries.detail(ticketId),
    staleTime: POLL_INTERVAL_MS,
    refetchInterval: POLL_INTERVAL_MS,
  });

  return (
    <>
      <Link
        href={ROUTES.admin.tickets}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        Ticket queue
      </Link>

      <div className="mt-6">
        {error ? (
          <p role="alert" className="rounded-lg border bg-card p-6 text-sm">
            {error.message}
          </p>
        ) : isPending ? (
          <div aria-busy aria-label="Loading ticket" className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-2/3" />
            <div className="grid gap-8 pt-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <Skeleton className="h-72 rounded-lg" />
              <Skeleton className="h-72 rounded-lg" />
            </div>
          </div>
        ) : (
          <AdminTicketWorkspace
            ticket={data.ticket}
            currentAdminId={currentAdminId}
          />
        )}
      </div>
    </>
  );
}
