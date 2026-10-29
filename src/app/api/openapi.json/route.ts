import { NextResponse } from "next/server";

import { openApiDocument } from "@/lib/openapi";

// The spec is built from the request validators, so it's always current
export const GET = () => NextResponse.json(openApiDocument);
