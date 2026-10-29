import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Bookshelf } from "@/components/landing/bookshelf";

import { cn } from "@/lib/utils";

import { ROUTES } from "@/constants/routes";

const sampleBooks = [
  { title: "The Salt Orchard", format: "Paperback", isbn: "978-0-00-000142-1" },
  { title: "Small Hours", format: "eBook", isbn: "978-0-00-000187-2" },
  {
    title: "Letters to Kasauli",
    format: "Paperback",
    isbn: "978-0-00-000203-9",
  },
  {
    title: "Monsoon Arithmetic",
    format: "Hardcover",
    isbn: "978-0-00-000231-2",
  },
];

const ticketStages = ["Open", "In progress", "Resolved"];
const CURRENT_STAGE = 1;

const ctaClassName = "h-10 px-4 text-[0.95rem]";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Link
          href={ROUTES.home}
          className="rounded-sm font-serif text-xl font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Bookleaf
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href={ROUTES.auth.login}
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Log in
          </Link>
          <Link
            href={ROUTES.auth.register}
            className={buttonVariants({ size: "lg" })}
          >
            Create account
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <h1 className="font-serif text-[2.6rem] leading-[1.05] font-medium tracking-tight text-balance [font-optical-sizing:auto] sm:text-6xl">
              Your books on one shelf.{" "}
              <em className="text-primary">Your questions in one queue.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              See every title you&apos;ve published with Bookleaf, and raise a
              support ticket about any of them, from a royalty question to a
              cover fix. Each ticket shows its status until it&apos;s resolved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ROUTES.auth.register}
                className={cn(buttonVariants({ size: "lg" }), ctaClassName)}
              >
                Create account
              </Link>
              <Link
                href={ROUTES.auth.login}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  ctaClassName,
                )}
              >
                Log in
              </Link>
            </div>
          </div>

          <Bookshelf />
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto grid w-full max-w-6xl gap-16 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-12">
            <article>
              <h2 className="font-serif text-3xl font-medium tracking-tight">
                Your shelf
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
                Every book you&apos;ve published with us, listed in one place
                with its format and ISBN.
              </p>

              <div
                aria-hidden
                className="mt-8 overflow-hidden rounded-lg border bg-card shadow-xs"
              >
                <ul className="divide-y">
                  {sampleBooks.map((book) => (
                    <li
                      key={book.isbn}
                      className="flex items-baseline justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-serif text-[1.05rem]">
                          {book.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {book.format}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {book.isbn}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article>
              <h2 className="font-serif text-3xl font-medium tracking-tight">
                Support tickets
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
                Raise a ticket about a specific book, describe what&apos;s
                wrong, and check its status whenever you like.
              </p>

              <div
                aria-hidden
                className="mt-8 rounded-lg border bg-card p-5 shadow-xs"
              >
                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                  <span>#0142</span>
                  <span>Letters to Kasauli</span>
                </div>
                <p className="mt-3 font-serif text-xl leading-snug">
                  Royalty statement missing for March
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The February statement arrived, but March isn&apos;t on the
                  dashboard yet. Could you check?
                </p>

                <ol className="mt-6 flex items-center gap-2">
                  {ticketStages.map((stage, index) => (
                    <li key={stage} className="flex flex-1 flex-col gap-2">
                      <span
                        className={cn(
                          "h-1.5 rounded-full",
                          index <= CURRENT_STAGE ? "bg-primary" : "bg-border",
                        )}
                      />
                      <span
                        className={cn(
                          "font-mono text-[0.7rem] tracking-wide uppercase",
                          index === CURRENT_STAGE
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {stage}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-8">
          <span className="font-serif">Bookleaf</span>
          <span>For authors published with Bookleaf</span>
        </div>
      </footer>
    </div>
  );
}
