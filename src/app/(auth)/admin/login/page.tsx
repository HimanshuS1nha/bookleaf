import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

import { API_ROUTES } from "@/constants/api-routes";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Admin login · Bookleaf",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <>
      <p className="font-mono text-xs tracking-wide text-primary uppercase">
        Admin
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight">
        Staff login
      </h1>
      <p className="mt-2 text-muted-foreground">
        For Bookleaf staff managing authors and their books.
      </p>

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-xs">
        <LoginForm
          endpoint={`/api${API_ROUTES.admin.auth.login}`}
          redirectTo={ROUTES.admin.dashboard}
        />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Not staff?{" "}
        <Link
          href={ROUTES.auth.login}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Author login
        </Link>
      </p>
    </>
  );
}
