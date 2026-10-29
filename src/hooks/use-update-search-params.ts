"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Filters live in the URL so they survive refreshes and back/forward
export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, item));
      } else if (value) {
        params.set(key, value);
      }
    }

    // Any filter change should start from the first page again
    if (!("page" in updates)) {
      params.delete("page");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const clearParams = () => router.replace(pathname, { scroll: false });

  return { searchParams, updateParams, clearParams };
}
