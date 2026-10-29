"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

import { API_ROUTES } from "@/constants/api-routes";

export function LogoutButton({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useMutation({
    mutationFn: async () => {
      let res: Response;
      try {
        res = await fetch(`/api${API_ROUTES.auth.logout}`, { method: "POST" });
      } catch {
        throw new Error("Couldn't reach the server. Check your connection.");
      }

      // 204 has no body, so apiFetch's JSON handling doesn't fit here
      if (!res.ok) {
        throw new Error("Couldn't log out. Please try again.");
      }
    },
    onSuccess: () => {
      // Don't leave the previous author's data cached for the next login
      queryClient.clear();
      router.replace(redirectTo);
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Button
      variant="ghost"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      {logout.isPending ? "Logging out…" : "Log out"}
    </Button>
  );
}
