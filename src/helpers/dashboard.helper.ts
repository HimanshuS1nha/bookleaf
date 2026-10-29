import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { AuthHelper } from "@/helpers/auth.helper";

import { ROUTES } from "@/constants/routes";

// Layout and page render in parallel, so both call these; cache() dedupes the lookup per request
export const getDashboardAuthor = cache(async () => {
  const author = await AuthHelper.getAuthorFromToken();
  if (!author) {
    redirect(ROUTES.auth.login);
  }

  return author;
});

export const getDashboardAdmin = cache(async () => {
  const admin = await AuthHelper.getAdminFromToken();
  if (!admin) {
    redirect(ROUTES.admin.login);
  }

  return admin;
});
