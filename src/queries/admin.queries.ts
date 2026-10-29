import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-fetch";

import { API_ROUTES } from "@/constants/api-routes";

import { AdminListItemType } from "@/types";

export const adminQueries = {
  all: () =>
    queryOptions({
      queryKey: ["admin", "admins"],
      queryFn: () =>
        apiFetch<{ admins: AdminListItemType[] }>(API_ROUTES.admin.admins),
      // The team list rarely changes during a session
      staleTime: 5 * 60 * 1000,
    }),
};
