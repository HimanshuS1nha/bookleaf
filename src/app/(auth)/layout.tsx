import Link from "next/link";

import { ROUTES } from "@/constants/routes";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 py-5 sm:px-8">
        <Link
          href={ROUTES.home}
          className="rounded-sm font-serif text-xl font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Bookleaf
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pt-12 pb-20 sm:pt-20">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
