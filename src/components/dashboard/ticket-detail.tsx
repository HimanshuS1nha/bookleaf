"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, MessageSquareTextIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/tickets/ticket-status-badge";

import { formatDateTime, formatShortId } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ROUTES } from "@/constants/routes";
import {
  GENERAL_TICKET_LABEL,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
} from "@/constants/ticket";

import { ticketQueries } from "@/queries/ticket.queries";

import { AuthorTicketType } from "@/types";

const POLL_INTERVAL_MS = 30 * 1000;

// Read-only: authors watch their ticket move through the queue but can't change it
export function TicketDetail({
  authorId,
  ticketId,
}: {
  authorId: string;
  ticketId: string;
}) {
  const { data, error, isPending } = useQuery({
    ...ticketQueries.detail(authorId, ticketId),
    // Polls so status changes and replies from the team show up without a refresh
    staleTime: POLL_INTERVAL_MS,
    refetchInterval: POLL_INTERVAL_MS,
  });

  return (
    <>
      <Link
        href={ROUTES.tickets.list}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        All tickets
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
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        ) : (
          <TicketContent ticket={data.ticket} />
        )}
      </div>
    </>
  );
}

function TicketContent({ ticket }: { ticket: AuthorTicketType }) {
  const currentStageIndex = TICKET_STATUSES.indexOf(ticket.status);

  return (
    <>
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="text-foreground">{formatShortId(ticket.id)}</span>
          <span>Raised {formatDateTime(ticket.createdAt)}</span>
        </div>

        <h1 className="mt-3 font-serif text-3xl leading-tight font-medium tracking-tight text-balance">
          {ticket.subject}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
          <span className="text-sm text-muted-foreground">
            {TICKET_CATEGORY_LABELS[ticket.category]}
          </span>
        </div>

        <ol
          aria-label="Ticket progress"
          className="mt-6 flex items-center gap-2"
        >
          {TICKET_STATUSES.map((status, index) => (
            <li
              key={status}
              aria-current={index === currentStageIndex ? "step" : undefined}
              className="flex flex-1 flex-col gap-2"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  index <= currentStageIndex ? "bg-primary" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "font-mono text-[0.7rem] tracking-wide uppercase",
                  index === currentStageIndex
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {TICKET_STATUS_LABELS[status]}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="lg:order-last">
          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="flex justify-end">
                  <TicketStatusBadge status={ticket.status} />
                </dd>
                <dt className="text-muted-foreground">Priority</dt>
                <dd className="flex justify-end">
                  <TicketPriorityBadge priority={ticket.priority} />
                </dd>
                <dt className="text-muted-foreground">About</dt>
                <dd className="text-right">
                  {ticket.book?.title ?? GENERAL_TICKET_LABEL}
                </dd>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-right">
                  {TICKET_CATEGORY_LABELS[ticket.category]}
                </dd>
                <dt className="text-muted-foreground">Raised</dt>
                <dd className="text-right">
                  {formatDateTime(ticket.createdAt)}
                </dd>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd className="text-right">
                  {formatDateTime(ticket.updatedAt)}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle>Your request</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <section aria-labelledby="response-heading">
            <h2 id="response-heading" className="font-serif text-xl">
              Response from Bookleaf
            </h2>
            {ticket.responseMessage ? (
              <div className="mt-4 rounded-lg border border-l-2 border-l-primary bg-card p-5 shadow-xs">
                <p className="leading-relaxed whitespace-pre-wrap">
                  {ticket.responseMessage}
                </p>
                <p className="mt-4 font-mono text-xs text-muted-foreground">
                  Last updated {formatDateTime(ticket.updatedAt)}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed p-5">
                <MessageSquareTextIcon
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  No reply yet. Our team&apos;s response will appear here, and
                  this page updates on its own.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
