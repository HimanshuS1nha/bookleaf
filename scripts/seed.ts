// Seeds the local database with dummy data for manual testing.
// Usage: pnpm db:seed           (refuses if accounts already exist)
//        pnpm db:seed --reset   (wipes every app table first)

import "dotenv/config";

import argon2 from "argon2";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import sampleData from "./bookleaf_sample_data.json";
import {
  adminTable,
  authorTable,
  bookRoyaltyTable,
  bookTable,
  ticketActivityTable,
  ticketNoteTable,
  ticketTable,
} from "../src/db/schema";

const PASSWORD = "12345678";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function main() {
  const shouldReset = process.argv.includes("--reset");

  const [existingAdmin] = await db.select().from(adminTable).limit(1);
  const [existingAuthor] = await db.select().from(authorTable).limit(1);
  if ((existingAdmin || existingAuthor) && !shouldReset) {
    console.error(
      "Database already has data. Run `pnpm db:seed --reset` to wipe it and seed again.",
    );
    process.exitCode = 1;
    return;
  }

  if (shouldReset) {
    // Children first so foreign keys don't block the deletes
    await db.delete(ticketActivityTable);
    await db.delete(ticketNoteTable);
    await db.delete(ticketTable);
    await db.delete(bookRoyaltyTable);
    await db.delete(bookTable);
    await db.delete(authorTable);
    await db.delete(adminTable);
    console.log("Cleared existing data");
  }

  // Every seeded account shares one password, so hash it once
  const passwordHash = await argon2.hash(PASSWORD);

  const admins = await db
    .insert(adminTable)
    .values([
      { name: "admin1", email: "admin1@bookleaf.test", passwordHash },
      { name: "admin2", email: "admin2@bookleaf.test", passwordHash },
      { name: "admin3", email: "admin3@bookleaf.test", passwordHash },
    ])
    .returning();

  // Authors and books come from the sample data file, matched back up by email
  const authors = await db
    .insert(authorTable)
    .values(
      sampleData.authors.map((author) => ({
        name: author.name,
        email: author.email,
        passwordHash,
        city: author.city,
        phone: author.phone,
        joinedDate: author.joined_date,
      })),
    )
    .returning();

  const authorIdByEmail = new Map(
    authors.map((author) => [author.email, author.id]),
  );
  const sampleBooks = sampleData.authors.flatMap((author) =>
    author.books.map((book) => ({
      ...book,
      authorId: authorIdByEmail.get(author.email)!,
    })),
  );

  const books = await db
    .insert(bookTable)
    .values(
      sampleBooks.map((book) => ({
        authorId: book.authorId,
        title: book.title,
        isbn: book.isbn,
        genre: book.genre,
        publicationDate: book.publication_date,
        status: book.status,
        mrp: book.mrp,
        printPartner: book.print_partner,
        availableOn: book.available_on,
      })),
    )
    .returning();

  const sampleBookByIsbn = new Map(
    sampleBooks.map((book) => [book.isbn, book]),
  );

  // Earned and pending amounts are derived from these, so they aren't stored
  await db.insert(bookRoyaltyTable).values(
    books.map((book) => {
      const sample = sampleBookByIsbn.get(book.isbn)!;
      return {
        bookId: book.id,
        authorId: book.authorId,
        authorRoyaltyPerCopy: sample.author_royalty_per_copy,
        totalCopiesSold: sample.total_copies_sold,
        royaltyPaid: sample.royalty_paid,
        lastRoyaltyPayoutDate: sample.last_royalty_payout_date,
      };
    }),
  );

  const authorByEmail = (email: string) =>
    authors.find((author) => author.email === email)!;
  const priya = authorByEmail("priya.sharma@email.com");
  const rohitKapoor = authorByEmail("rohit.kapoor@email.com");
  const sneha = authorByEmail("sneha.kulkarni@email.com");
  const diya = authorByEmail("diya.chatterjee@email.com");
  const kavita = authorByEmail("kavita.deshmukh@email.com");
  const [admin1, admin2, admin3] = admins;
  const bookIdByTitle = (title: string) =>
    books.find((book) => book.title === title)!.id;

  // Mixed priorities, statuses and ages so queue ordering and filters have something to show.
  // Resolved/closed tickets carry a response, matching the rule the admin API enforces.
  const tickets = await db
    .insert(ticketTable)
    .values([
      {
        authorId: priya.id,
        bookId: bookIdByTitle("Whispers of the Ganges"),
        assignedTo: admin1.id,
        subject: "Royalty statement missing for September",
        description:
          "I received my August royalty statement but September's hasn't shown up. Whispers of the Ganges sold well at the Mumbai lit fest, so I'd like to check the numbers.",
        status: "in_progress",
        priority: "high",
        category: "royalty_and_payments",
        aiResponse:
          "Hi Priya,\n\nThanks for flagging this. We'll check why your September royalty statement for Whispers of the Ganges hasn't been generated and confirm the sales from the Mumbai lit fest are included. Could you share roughly how many copies were sold at the event?\n\nBookleaf Support",
        createdAt: daysAgo(6, 9),
      },
      {
        authorId: rohitKapoor.id,
        bookId: bookIdByTitle("Startup Sutra"),
        assignedTo: null,
        subject: "Startup Sutra unavailable on Amazon",
        description:
          "Since yesterday the Amazon listing for Startup Sutra says 'currently unavailable'. I've got a newspaper review coming out this weekend and readers won't be able to buy it.",
        status: "open",
        priority: "critical",
        category: "distribution_and_availability",
        aiResponse:
          "Hi Rohit,\n\nWe understand how urgent this is with the review coming out. We're checking the Amazon listing for Startup Sutra with our distribution partner now. Could you send a screenshot of the listing and the marketplace region you're seeing it in?\n\nBookleaf Support",
        createdAt: daysAgo(1, 8),
      },
      {
        authorId: sneha.id,
        bookId: bookIdByTitle("Midnight in Mysore"),
        assignedTo: admin2.id,
        subject: "When will Midnight in Mysore go to print?",
        description:
          "I approved the cover concept two weeks ago. Is there an expected print date for Midnight in Mysore?",
        status: "resolved",
        priority: "medium",
        category: "book_status_and_production_updates",
        responseMessage:
          "Hi Sneha,\n\nThe final cover for Midnight in Mysore is being wrapped up this week, and printing is scheduled right after with our print partner. You'll get an email once copies are dispatched to distributors.\n\nBookleaf Support",
        aiResponse:
          "Hi Sneha,\n\nThanks for approving your cover concept. We'll check the print schedule for Midnight in Mysore and get back to you with an expected date.\n\nBookleaf Support",
        createdAt: daysAgo(12, 14),
      },
      {
        authorId: diya.id,
        bookId: bookIdByTitle("Howrah Nights"),
        assignedTo: null,
        subject: "Wrong ISBN printed on back cover",
        description:
          "The back cover of Howrah Nights shows 978-93-5XXXX-18-6 but my ISBN is 978-93-5XXXX-18-9. Copies are already in stores.",
        status: "open",
        priority: "critical",
        category: "isbn_and_metadata",
        aiResponse:
          "Hi Diya,\n\nThank you for catching this. We'll compare the cover file with the registered ISBN for Howrah Nights and check which print runs are affected. Do you know roughly when you first noticed copies in stores?\n\nBookleaf Support",
        createdAt: daysAgo(3, 16),
      },
      {
        authorId: kavita.id,
        bookId: bookIdByTitle("Raising Roots"),
        assignedTo: admin3.id,
        subject: "How is MRP decided for a paperback?",
        description:
          "Raising Roots is being typeset and I want to understand how the MRP is set and whether I can choose it.",
        status: "closed",
        priority: "low",
        category: "general_inquiry",
        responseMessage:
          "Hi Kavita,\n\nMRP is suggested from page count, trim size and print costs, and you can adjust it within a range once typesetting is done. We've emailed you our pricing guide.\n\nBookleaf Support",
        aiResponse:
          "Hi Kavita,\n\nGreat question. We'll share how MRP is calculated and what flexibility you have when setting it.\n\nBookleaf Support",
        createdAt: daysAgo(20, 11),
      },
    ])
    .returning();

  const [royaltyTicket, amazonTicket, printTicket, isbnTicket, mrpTicket] =
    tickets;

  await db.insert(ticketNoteTable).values([
    {
      ticketId: royaltyTicket.id,
      createdBy: admin1.id,
      note: "Finance confirmed the September batch job failed for 12 authors. Re-run scheduled for tonight.",
      createdAt: daysAgo(5, 11),
    },
    {
      ticketId: royaltyTicket.id,
      createdBy: admin2.id,
      note: "Lit fest sales were entered manually, double check they're in the re-run.",
      createdAt: daysAgo(4, 15),
    },
    {
      ticketId: amazonTicket.id,
      createdBy: admin3.id,
      note: "Looks like a feed rejection on Amazon's side, raised with the distributor.",
      createdAt: daysAgo(0, 9),
    },
    {
      ticketId: printTicket.id,
      createdBy: admin2.id,
      note: "Cover sign-off due Friday, print slot pencilled in with Repro India for the week after.",
      createdAt: daysAgo(10, 12),
    },
    {
      ticketId: isbnTicket.id,
      createdBy: admin1.id,
      note: "Cover file in the print folder has the typo. Need to check how many copies went out.",
      createdAt: daysAgo(2, 10),
    },
  ]);

  // History that explains how each ticket reached its seeded state
  const minutesAfter = (date: Date, minutes: number) =>
    new Date(date.getTime() + minutes * 60 * 1000);

  const activity = await db
    .insert(ticketActivityTable)
    .values([
      ...tickets.map((ticket) => ({
        ticketId: ticket.id,
        type: "created" as const,
        actorType: "author" as const,
        toValue: "open",
        createdAt: ticket.createdAt,
      })),
      {
        ticketId: amazonTicket.id,
        type: "priority_changed" as const,
        actorType: "system" as const,
        fromValue: "medium",
        toValue: "critical",
        createdAt: minutesAfter(amazonTicket.createdAt, 1),
      },
      {
        ticketId: isbnTicket.id,
        type: "priority_changed" as const,
        actorType: "system" as const,
        fromValue: "medium",
        toValue: "critical",
        createdAt: minutesAfter(isbnTicket.createdAt, 1),
      },
      {
        ticketId: royaltyTicket.id,
        type: "assignee_changed" as const,
        actorType: "admin" as const,
        actorAdminId: admin1.id,
        fromValue: null,
        toValue: admin1.id,
        createdAt: minutesAfter(royaltyTicket.createdAt, 90),
      },
      {
        ticketId: royaltyTicket.id,
        type: "status_changed" as const,
        actorType: "admin" as const,
        actorAdminId: admin1.id,
        fromValue: "open",
        toValue: "in_progress",
        createdAt: minutesAfter(royaltyTicket.createdAt, 90),
      },
      {
        ticketId: printTicket.id,
        type: "response_updated" as const,
        actorType: "admin" as const,
        actorAdminId: admin2.id,
        fromValue: null,
        toValue: printTicket.responseMessage,
        createdAt: daysAgo(10, 13),
      },
      {
        ticketId: printTicket.id,
        type: "status_changed" as const,
        actorType: "admin" as const,
        actorAdminId: admin2.id,
        fromValue: "open",
        toValue: "resolved",
        createdAt: daysAgo(10, 13),
      },
      {
        ticketId: mrpTicket.id,
        type: "status_changed" as const,
        actorType: "admin" as const,
        actorAdminId: admin3.id,
        fromValue: "open",
        toValue: "closed",
        createdAt: daysAgo(19, 10),
      },
    ])
    .returning();

  console.log(`
Seeded ${admins.length} admins, ${authors.length} authors, ${books.length} books (each with a book_royalty row),
${tickets.length} tickets, 5 ticket_notes and ${activity.length} ticket_activity rows (each ticket's history).

All accounts use the password: ${PASSWORD}

Admins (log in at /admin/login):
${admins.map((admin) => `  ${admin.email}`).join("\n")}

Authors (log in at /login):
${authors.map((author) => `  ${author.email}`).join("\n")}
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
