"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ChipFilterGroup,
  DateRangeInputs,
  SearchInput,
  TicketsPagination,
  TicketsSkeleton,
} from "@/components/tickets/ticket-filter-controls";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/tickets/ticket-status-badge";

import { useUpdateSearchParams } from "@/hooks/use-update-search-params";

import { formatDate, formatShortId } from "@/lib/format";
import { parsePage, pickAllowed, toLocalIso } from "@/lib/ticket-filters";
import { cn } from "@/lib/utils";

import { ROUTES } from "@/constants/routes";
import {
  GENERAL_TICKET_LABEL,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
} from "@/constants/ticket";

import { ticketQueries } from "@/queries/ticket.queries";

const POLL_INTERVAL_MS = 30 * 1000;

export function TicketsView({ authorId }: { authorId: string }) {
  const { searchParams, updateParams, clearParams } = useUpdateSearchParams();

  // Bumped on "Clear filters" so the search box, which keeps its own state, resets too
  const [searchResetKey, setSearchResetKey] = useState(0);

  const search = searchParams.get("q") ?? "";
  const statuses = pickAllowed(searchParams.getAll("status"), TICKET_STATUSES);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const page = parsePage(searchParams.get("page"));

  const hasFilters = Boolean(search || statuses.length || from || to);

  const { data, error, isPending, isPlaceholderData } = useQuery({
    ...ticketQueries.list(authorId, {
      search,
      statuses,
      from: toLocalIso(from, "00:00:00"),
      to: toLocalIso(to, "23:59:59.999"),
      page,
    }),
    // Polls so status changes from the team show up without a refresh
    staleTime: POLL_INTERVAL_MS,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const clearFilters = () => {
    setSearchResetKey((key) => key + 1);
    clearParams();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-xs">
        <SearchInput
          key={searchResetKey}
          initialValue={search}
          placeholder="Search by subject or description"
          onSearch={(value) => updateParams({ q: value })}
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <ChipFilterGroup
            legend="Status"
            options={TICKET_STATUSES}
            labels={TICKET_STATUS_LABELS}
            selected={statuses}
            onChange={(selected) => updateParams({ status: selected })}
          />

          <div className="flex flex-wrap items-end gap-3">
            <DateRangeInputs from={from} to={to} onChange={updateParams} />
            {hasFilters && (
              <Button variant="ghost" className="h-10" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border bg-card p-6 text-sm">
          {error.message}
        </p>
      ) : isPending ? (
        <TicketsSkeleton />
      ) : data.tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-14 text-center">
          {hasFilters ? (
            <>
              <p className="font-serif text-xl">No matching tickets</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different search or widen the filters.
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-xl">No tickets yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Raise a ticket and our team will get back to you here.
              </p>
            </>
          )}
        </div>
      ) : (
        <div
          aria-busy={isPlaceholderData}
          className={cn(
            "transition-opacity",
            isPlaceholderData && "opacity-60",
          )}
        >
          <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs">
            {data.tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={ROUTES.tickets.detail(ticket.id)}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                      <span>{formatShortId(ticket.id)}</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate font-serif text-lg leading-snug">
                      {ticket.subject}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {ticket.book?.title ?? GENERAL_TICKET_LABEL} ·{" "}
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <TicketsPagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            shownCount={data.tickets.length}
            onPageChange={(nextPage) =>
              updateParams({ page: String(nextPage) })
            }
          />
        </div>
      )}
    </div>
  );
}
