import { NextResponse } from "next/server";

import { AuthHelper } from "@/helpers/auth.helper";

export const POST = async () => {
  await AuthHelper.clearTokenCookie();

  return new NextResponse(null, { status: 204 });
};
