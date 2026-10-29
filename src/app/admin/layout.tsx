import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import { getDashboardAdmin } from "@/helpers/dashboard.helper";

import { ROUTES } from "@/constants/routes";

const navItems = [{ href: ROUTES.admin.tickets, label: "Tickets" }];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getDashboardAdmin();

  return (
    <DashboardShell
      navItems={navItems}
      accountName={admin.name}
      badge="Admin"
      logoutRedirectTo={ROUTES.admin.login}
    >
      {children}
    </DashboardShell>
  );
}
