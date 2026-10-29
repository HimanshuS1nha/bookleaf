import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-fetch";

import { API_ROUTES } from "@/constants/api-routes";

import { BookType } from "@/types";

export const bookQueries = {
  all: (authorId: string) =>
    queryOptions({
      queryKey: ["authors", authorId, "books"],
      queryFn: () =>
        apiFetch<{ books: BookType[] }>(API_ROUTES.authors.books(authorId)),
    }),
};
