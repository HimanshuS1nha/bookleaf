"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { formatDateTime, formatShortId } from "@/lib/format";
import { parsePage, pickAllowed, toLocalIso } from "@/lib/ticket-filters";
import { cn } from "@/lib/utils";

import { ROUTES } from "@/constants/routes";
import {
  GENERAL_TICKET_LABEL,
  TICKET_ASSIGNMENT_LABELS,
  TICKET_ASSIGNMENTS,
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
} from "@/constants/ticket";

import { adminTicketQueries } from "@/queries/admin-ticket.queries";

import { AdminTicketListItemType } from "@/types";

// Base UI's Select can't use null as an item value, so "All" gets a sentinel
const ALL = "all";

const categoryItems = [
  { value: ALL, label: "All categories" },
  ...TICKET_CATEGORIES.map((category) => ({
    value: category,
    label: TICKET_CATEGORY_LABELS[category],
  })),
];

const assignmentItems = TICKET_ASSIGNMENTS.map((assignment) => ({
  value: assignment,
  label: TICKET_ASSIGNMENT_LABELS[assignment],
}));

// Polls so new tickets and AI triage results show up without a refresh
const POLL_INTERVAL_MS = 30 * 1000;

const isUrgent = (ticket: AdminTicketListItemType) =>
  (ticket.status === "open" || ticket.status === "in_progress") &&
  (ticket.priority === "critical" || ticket.priority === "high");

export function AdminTicketsView() {
  const { searchParams, updateParams, clearParams } = useUpdateSearchParams();

  // Bumped on "Clear filters" so the search box, which keeps its own state, resets too
  const [searchResetKey, setSearchResetKey] = useState(0);

  const search = searchParams.get("q") ?? "";
  const statuses = pickAllowed(searchParams.getAll("status"), TICKET_STATUSES);
  const priorities = pickAllowed(
    searchParams.getAll("priority"),
    TICKET_PRIORITIES,
  );
  const category =
    pickAllowed(searchParams.getAll("category"), TICKET_CATEGORIES)[0] ?? null;
  const assignment =
    pickAllowed(searchParams.getAll("assignment"), TICKET_ASSIGNMENTS)[0] ??
    "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const page = parsePage(searchParams.get("page"));

  const hasFilters = Boolean(
    search ||
    statuses.length ||
    priorities.length ||
    category ||
    assignment !== "all" ||
    from ||
    to,
  );

  const { data, error, isPending, isPlaceholderData } = useQuery({
    ...adminTicketQueries.list({
      search,
      statuses,
      priorities,
      categories: category ? [category] : [],
      assignment,
      from: toLocalIso(from, "00:00:00"),
      to: toLocalIso(to, "23:59:59.999"),
      page,
    }),
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
          placeholder="Search by subject, description, author name or email"
          onSearch={(value) => updateParams({ q: value })}
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
          <ChipFilterGroup
            legend="Status"
            options={TICKET_STATUSES}
            labels={TICKET_STATUS_LABELS}
            selected={statuses}
            onChange={(selected) => updateParams({ status: selected })}
          />
          <ChipFilterGroup
            legend="Priority"
            options={TICKET_PRIORITIES}
            labels={TICKET_PRIORITY_LABELS}
            selected={priorities}
            onChange={(selected) => updateParams({ priority: selected })}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-64 gap-1.5">
            <FieldLabel
              htmlFor="category"
              className="text-xs font-normal text-muted-foreground"
            >
              Category
            </FieldLabel>
            <Select
              items={categoryItems}
              value={category ?? ALL}
              onValueChange={(value: string | null) =>
                updateParams({ category: value === ALL ? null : value })
              }
            >
              <SelectTrigger
                id="category"
                className="h-10 w-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-44 gap-1.5">
            <FieldLabel
              htmlFor="assignment"
              className="text-xs font-normal text-muted-foreground"
            >
              Assigned to
            </FieldLabel>
            <Select
              items={assignmentItems}
              value={assignment}
              onValueChange={(value) =>
                updateParams({ assignment: value === "all" ? null : value })
              }
            >
              <SelectTrigger
                id="assignment"
                className="h-10 w-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignmentItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DateRangeInputs from={from} to={to} onChange={updateParams} />
          {hasFilters && (
            <Button variant="ghost" className="h-10" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
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
          <p className="font-serif text-xl">
            {hasFilters ? "No matching tickets" : "No tickets yet"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different search or widen the filters."
              : "Tickets raised by authors will show up here."}
          </p>
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
                  href={ROUTES.admin.ticket(ticket.id)}
                  className={cn(
                    "flex flex-col gap-3 border-l-2 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none lg:flex-row lg:items-center lg:justify-between lg:gap-6",
                    // Marks unresolved critical and high tickets, which sort to the top
                    isUrgent(ticket)
                      ? ticket.priority === "critical"
                        ? "border-l-chart-1"
                        : "border-l-chart-1/40"
                      : "border-l-transparent",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                      <span>{formatShortId(ticket.id)}</span>
                      <span>{formatDateTime(ticket.createdAt)}</span>
                      <span className="truncate">
                        {ticket.book?.title ?? GENERAL_TICKET_LABEL}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-serif text-lg leading-snug">
                      {ticket.subject}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      <span className="text-foreground">
                        {ticket.author.name}
                      </span>{" "}
                      · {ticket.author.email} ·{" "}
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "text-sm",
                        !ticket.assignee && "text-muted-foreground italic",
                      )}
                    >
                      {ticket.assignee?.name ?? "Unassigned"}
                    </span>
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
