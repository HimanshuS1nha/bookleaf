import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";

import { adminTable, ticketNoteTable } from "@/db/schema";

export class TicketNoteDal {
  // Newest first, like an activity stream
  static async getAllByTicketId({ ticketId }: { ticketId: string }) {
    return db
      .select({
        id: ticketNoteTable.id,
        note: ticketNoteTable.note,
        createdAt: ticketNoteTable.createdAt,
        createdBy: {
          id: adminTable.id,
          name: adminTable.name,
        },
      })
      .from(ticketNoteTable)
      .leftJoin(adminTable, eq(ticketNoteTable.createdBy, adminTable.id))
      .where(eq(ticketNoteTable.ticketId, ticketId))
      .orderBy(desc(ticketNoteTable.createdAt));
  }

  static async create({
    ticketId,
    createdBy,
    note,
  }: {
    ticketId: string;
    createdBy: string;
    note: string;
  }) {
    const insertedData = await db
      .insert(ticketNoteTable)
      .values({ ticketId, createdBy, note })
      .returning({ id: ticketNoteTable.id });

    return insertedData[0];
  }
}
