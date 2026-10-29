import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-fetch";

import { API_ROUTES } from "@/constants/api-routes";
import { TicketStatus } from "@/constants/ticket";

import { AuthorTicketType } from "@/types";

export type TicketFilters = {
  search: string;
  statuses: TicketStatus[];
  // ISO timestamps already converted from the viewer's local dates
  from: string | null;
  to: string | null;
  page: number;
};

export type TicketsResponse = {
  tickets: AuthorTicketType[];
  total: number;
  page: number;
  pageSize: number;
};

export const ticketQueries = {
  // Prefix shared by every ticket query of an author, used for invalidation
  root: (authorId: string) => ["authors", authorId, "tickets"] as const,

  list: (authorId: string, filters: TicketFilters) =>
    queryOptions({
      queryKey: [...ticketQueries.root(authorId), "list", filters],
      queryFn: () => {
        const params = new URLSearchParams();
        if (filters.search) {
          params.set("search", filters.search);
        }
        filters.statuses.forEach((status) => params.append("status", status));
        if (filters.from) {
          params.set("from", filters.from);
        }
        if (filters.to) {
          params.set("to", filters.to);
        }
        params.set("page", String(filters.page));

        return apiFetch<TicketsResponse>(
          `${API_ROUTES.authors.tickets(authorId)}?${params}`,
        );
      },
      // Keep the current results on screen while a new filter loads
      placeholderData: keepPreviousData,
    }),

  detail: (authorId: string, ticketId: string) =>
    queryOptions({
      queryKey: [...ticketQueries.root(authorId), "detail", ticketId],
      queryFn: () =>
        apiFetch<{ ticket: AuthorTicketType }>(
          API_ROUTES.authors.ticket(authorId, ticketId),
        ),
    }),
};
