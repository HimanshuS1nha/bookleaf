// Calls one of our API routes and throws the server's message on failure,
// so TanStack Query's `error.message` is ready to show to the user
export async function apiFetch<T>(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.message ?? "Something went wrong. Please try again.");
  }

  return body as T;
}
