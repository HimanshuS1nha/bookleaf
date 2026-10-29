import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-fetch";

import { API_ROUTES } from "@/constants/api-routes";
import {
  TicketAssignment,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/constants/ticket";

import {
  AdminTicketDetailType,
  AdminTicketListItemType,
  TicketActivityEntryType,
  TicketNoteType,
} from "@/types";

export type AdminTicketFilters = {
  search: string;
  statuses: TicketStatus[];
  priorities: TicketPriority[];
  categories: TicketCategory[];
  assignment: TicketAssignment;
  // ISO timestamps already converted from the viewer's local dates
  from: string | null;
  to: string | null;
  page: number;
};

export type AdminTicketsResponse = {
  tickets: AdminTicketListItemType[];
  total: number;
  page: number;
  pageSize: number;
};

export const adminTicketQueries = {
  root: () => ["admin", "tickets"] as const,

  list: (filters: AdminTicketFilters) =>
    queryOptions({
      queryKey: [...adminTicketQueries.root(), "list", filters],
      queryFn: () => {
        const params = new URLSearchParams();
        if (filters.search) {
          params.set("search", filters.search);
        }
        filters.statuses.forEach((status) => params.append("status", status));
        filters.priorities.forEach((priority) =>
          params.append("priority", priority),
        );
        filters.categories.forEach((category) =>
          params.append("category", category),
        );
        params.set("assignment", filters.assignment);
        if (filters.from) {
          params.set("from", filters.from);
        }
        if (filters.to) {
          params.set("to", filters.to);
        }
        params.set("page", String(filters.page));

        return apiFetch<AdminTicketsResponse>(
          `${API_ROUTES.admin.tickets}?${params}`,
        );
      },
      // Keep the current results on screen while a new filter loads
      placeholderData: keepPreviousData,
    }),

  detail: (ticketId: string) =>
    queryOptions({
      queryKey: [...adminTicketQueries.root(), "detail", ticketId],
      queryFn: () =>
        apiFetch<{ ticket: AdminTicketDetailType }>(
          API_ROUTES.admin.ticket(ticketId),
        ),
    }),

  activity: (ticketId: string) =>
    queryOptions({
      queryKey: [...adminTicketQueries.root(), "detail", ticketId, "activity"],
      queryFn: () =>
        apiFetch<{ activity: TicketActivityEntryType[] }>(
          API_ROUTES.admin.ticketActivity(ticketId),
        ),
    }),

  notes: (ticketId: string) =>
    queryOptions({
      queryKey: [...adminTicketQueries.root(), "detail", ticketId, "notes"],
      queryFn: () =>
        apiFetch<{ notes: TicketNoteType[] }>(
          API_ROUTES.admin.ticketNotes(ticketId),
        ),
    }),
};
