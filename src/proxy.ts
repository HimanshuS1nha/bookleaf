import { NextRequest, NextResponse } from "next/server";
import { logger } from "./lib/logger";

import { ROUTES } from "./constants/routes";

export const proxy = (req: NextRequest) => {
  logger.info(`Incoming request on ${req.nextUrl.pathname}`);

  if (
    req.nextUrl.pathname.startsWith("/dashboard") &&
    !req.cookies.has("token")
  ) {
    return NextResponse.redirect(new URL(ROUTES.auth.login, req.url));
  }

  if (
    req.nextUrl.pathname.startsWith(ROUTES.admin.dashboard) &&
    req.nextUrl.pathname !== ROUTES.admin.login &&
    !req.cookies.has("token")
  ) {
    return NextResponse.redirect(new URL(ROUTES.admin.login, req.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/admin/:path*", "/"],
};
