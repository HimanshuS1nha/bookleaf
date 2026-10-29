import type { Metadata } from "next";

import { CreateTicketForm } from "@/components/dashboard/create-ticket-form";

import { getDashboardAuthor } from "@/helpers/dashboard.helper";

export const metadata: Metadata = {
  title: "New ticket · Bookleaf",
};

export default async function NewTicketPage() {
  const author = await getDashboardAuthor();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl font-medium tracking-tight">
        Raise a ticket
      </h1>
      <p className="mt-2 text-muted-foreground">
        Tell us what you need and our team will reply on the ticket.
      </p>

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-xs">
        <CreateTicketForm authorId={author.id} />
      </div>
    </div>
  );
}
