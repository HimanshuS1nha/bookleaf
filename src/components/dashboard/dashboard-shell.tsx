import Link from "next/link";
import { Toaster } from "react-hot-toast";

import { DashboardNav, NavItem } from "@/components/dashboard/dashboard-nav";
import { LogoutButton } from "@/components/dashboard/logout-button";

import { ROUTES } from "@/constants/routes";

// Shared chrome for the author dashboard and the admin dashboard
export function DashboardShell({
  navItems,
  accountName,
  badge,
  logoutRedirectTo,
  children,
}: {
  navItems: NavItem[];
  accountName: string;
  badge?: string;
  logoutRedirectTo: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-8">
            <div className="flex items-center gap-8">
              <div className="flex items-baseline gap-2">
                <Link
                  href={ROUTES.home}
                  className="rounded-sm font-serif text-xl font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Bookleaf
                </Link>
                {badge && (
                  <span className="font-mono text-xs tracking-wide text-primary uppercase">
                    {badge}
                  </span>
                )}
              </div>
              <DashboardNav items={navItems} />
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {accountName}
              </span>
              <LogoutButton redirectTo={logoutRedirectTo} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-20 sm:px-8">
          {children}
        </main>

        <Toaster position="bottom-right" />
      </div>
    </>
  );
}
