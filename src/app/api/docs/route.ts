import { ApiReference } from "@scalar/nextjs-api-reference";

// Interactive API reference rendered from /api/openapi.json
export const GET = ApiReference({
  url: "/api/openapi.json",
  pageTitle: "BookLeaf API",
});
