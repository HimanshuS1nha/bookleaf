import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import { getDashboardAuthor } from "@/helpers/dashboard.helper";

import { ROUTES } from "@/constants/routes";

const navItems = [
  { href: ROUTES.books, label: "Books" },
  { href: ROUTES.tickets.list, label: "Tickets" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const author = await getDashboardAuthor();

  return (
    <DashboardShell
      navItems={navItems}
      accountName={author.name}
      logoutRedirectTo={ROUTES.auth.login}
    >
      {children}
    </DashboardShell>
  );
}
