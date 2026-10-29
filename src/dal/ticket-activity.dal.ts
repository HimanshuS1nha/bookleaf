import "server-only";

import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";

import { adminTable, ticketActivityTable } from "@/db/schema";

export class TicketActivityDal {
  // Oldest first, matching the order things happened
  static async getAllByTicketId({ ticketId }: { ticketId: string }) {
    const rows = await db
      .select({
        id: ticketActivityTable.id,
        type: ticketActivityTable.type,
        actorType: ticketActivityTable.actorType,
        fromValue: ticketActivityTable.fromValue,
        toValue: ticketActivityTable.toValue,
        createdAt: ticketActivityTable.createdAt,
        actorAdmin: {
          id: adminTable.id,
          name: adminTable.name,
        },
      })
      .from(ticketActivityTable)
      .leftJoin(adminTable, eq(ticketActivityTable.actorAdminId, adminTable.id))
      .where(eq(ticketActivityTable.ticketId, ticketId))
      .orderBy(asc(ticketActivityTable.createdAt), asc(ticketActivityTable.id));

    // Assignee changes store admin ids, so look their names up in one query
    const assigneeIds = [
      ...new Set(
        rows
          .filter((row) => row.type === "assignee_changed")
          .flatMap((row) => [row.fromValue, row.toValue])
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const assignees =
      assigneeIds.length > 0
        ? await db
            .select({ id: adminTable.id, name: adminTable.name })
            .from(adminTable)
            .where(inArray(adminTable.id, assigneeIds))
        : [];
    const assigneeNames = new Map(
      assignees.map((admin) => [admin.id, admin.name]),
    );

    return rows.map((row) => {
      if (row.type !== "assignee_changed") {
        return row;
      }

      // Removed admins fall back to a label rather than a raw id
      const toName = (value: string | null) =>
        value ? (assigneeNames.get(value) ?? "Former staff member") : null;

      return {
        ...row,
        fromValue: toName(row.fromValue),
        toValue: toName(row.toValue),
      };
    });
  }
}
