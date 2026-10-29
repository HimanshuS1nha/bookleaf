import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

import { API_ROUTES } from "@/constants/api-routes";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Log in · Bookleaf",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="font-serif text-3xl font-medium tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 text-muted-foreground">
        Log in to see your books and support tickets.
      </p>

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-xs">
        <LoginForm
          endpoint={`/api${API_ROUTES.auth.login}`}
          redirectTo={ROUTES.dashboard}
        />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Bookleaf?{" "}
        <Link
          href={ROUTES.auth.register}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        <Link
          href={ROUTES.admin.login}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Admin login
        </Link>
      </p>
    </>
  );
}
