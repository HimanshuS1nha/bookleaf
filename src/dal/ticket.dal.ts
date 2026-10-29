import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  SQL,
  sql,
} from "drizzle-orm";

import { AnyPgColumn } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";

import {
  adminTable,
  authorTable,
  bookTable,
  ticketActivityTable,
  ticketTable,
} from "@/db/schema";

import {
  TicketAssignment,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/constants/ticket";

// Fields an author may see; assignedTo and aiResponse are internal
const authorTicketBaseColumns = {
  id: ticketTable.id,
  bookId: ticketTable.bookId,
  subject: ticketTable.subject,
  description: ticketTable.description,
  status: ticketTable.status,
  priority: ticketTable.priority,
  category: ticketTable.category,
  responseMessage: ticketTable.responseMessage,
  createdAt: ticketTable.createdAt,
  updatedAt: ticketTable.updatedAt,
};

// Reads also carry the book title; null for general / account level tickets
const authorTicketColumns = {
  ...authorTicketBaseColumns,
  book: {
    id: bookTable.id,
    title: bookTable.title,
  },
};

// The admin queue also needs to know who raised a ticket and who owns it
const adminTicketListColumns = {
  id: ticketTable.id,
  subject: ticketTable.subject,
  status: ticketTable.status,
  priority: ticketTable.priority,
  category: ticketTable.category,
  createdAt: ticketTable.createdAt,
  updatedAt: ticketTable.updatedAt,
  book: {
    id: bookTable.id,
    title: bookTable.title,
  },
  author: {
    id: authorTable.id,
    name: authorTable.name,
    email: authorTable.email,
  },
  assignee: {
    id: adminTable.id,
    name: adminTable.name,
  },
};

// Lower sorts first in the admin queue
const unresolvedFirst = sql`case when ${ticketTable.status} in ('open', 'in_progress') then 0 else 1 end`;
const priorityRank = sql`case ${ticketTable.priority}
  when 'critical' then 0
  when 'high' then 1
  when 'medium' then 2
  else 3
end`;

// Stops user input like "100%" being read as a LIKE pattern
const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, "\\$&");

// Conditions shared by the author and admin ticket lists
const commonFilterConditions = ({
  search,
  searchColumns,
  statuses,
  from,
  to,
}: {
  search?: string;
  searchColumns: AnyPgColumn[];
  statuses: TicketStatus[];
  from?: Date;
  to?: Date;
}) => {
  const conditions: (SQL | undefined)[] = [];

  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`;
    conditions.push(
      or(...searchColumns.map((column) => ilike(column, pattern))),
    );
  }
  if (statuses.length > 0) {
    conditions.push(inArray(ticketTable.status, statuses));
  }
  if (from) {
    conditions.push(gte(ticketTable.createdAt, from));
  }
  if (to) {
    conditions.push(lte(ticketTable.createdAt, to));
  }

  return conditions;
};

export class TicketDal {
  static async getAllByAuthorId({
    authorId,
    search,
    statuses,
    from,
    to,
    page,
    pageSize,
  }: {
    authorId: string;
    search?: string;
    statuses: TicketStatus[];
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) {
    const where = and(
      eq(ticketTable.authorId, authorId),
      ...commonFilterConditions({
        search,
        searchColumns: [ticketTable.subject, ticketTable.description],
        statuses,
        from,
        to,
      }),
    );

    const [tickets, totalData] = await Promise.all([
      db
        .select(authorTicketColumns)
        .from(ticketTable)
        .leftJoin(bookTable, eq(ticketTable.bookId, bookTable.id))
        .where(where)
        .orderBy(desc(ticketTable.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ total: count() }).from(ticketTable).where(where),
    ]);

    return { tickets, total: totalData[0].total };
  }

  // Unresolved tickets first, then by priority, then oldest first so the
  // most urgent and longest-waiting work sits at the top of the queue
  static async getAllForAdmin({
    adminId,
    search,
    statuses,
    priorities,
    categories,
    assignment,
    from,
    to,
    page,
    pageSize,
  }: {
    adminId: string;
    search?: string;
    statuses: TicketStatus[];
    priorities: TicketPriority[];
    categories: TicketCategory[];
    assignment: TicketAssignment;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) {
    const where = and(
      ...commonFilterConditions({
        search,
        searchColumns: [
          ticketTable.subject,
          ticketTable.description,
          authorTable.name,
          authorTable.email,
        ],
        statuses,
        from,
        to,
      }),
      priorities.length > 0
        ? inArray(ticketTable.priority, priorities)
        : undefined,
      categories.length > 0
        ? inArray(ticketTable.category, categories)
        : undefined,
      assignment === "mine" ? eq(ticketTable.assignedTo, adminId) : undefined,
      assignment === "unassigned" ? isNull(ticketTable.assignedTo) : undefined,
    );

    const [tickets, totalData] = await Promise.all([
      db
        .select(adminTicketListColumns)
        .from(ticketTable)
        .innerJoin(authorTable, eq(ticketTable.authorId, authorTable.id))
        .leftJoin(adminTable, eq(ticketTable.assignedTo, adminTable.id))
        .leftJoin(bookTable, eq(ticketTable.bookId, bookTable.id))
        .where(where)
        .orderBy(
          unresolvedFirst,
          priorityRank,
          asc(ticketTable.createdAt),
          // Tie-breaker so pages stay stable when timestamps match
          asc(ticketTable.id),
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      // Joined because search can match the author's name or email
      db
        .select({ total: count() })
        .from(ticketTable)
        .innerJoin(authorTable, eq(ticketTable.authorId, authorTable.id))
        .where(where),
    ]);

    return { tickets, total: totalData[0].total };
  }

  static async getByIdForAuthor({
    id,
    authorId,
  }: {
    id: string;
    authorId: string;
  }) {
    const data = await db
      .select(authorTicketColumns)
      .from(ticketTable)
      .leftJoin(bookTable, eq(ticketTable.bookId, bookTable.id))
      .where(and(eq(ticketTable.id, id), eq(ticketTable.authorId, authorId)))
      .limit(1);

    return data[0];
  }

  static async create({
    authorId,
    bookId,
    subject,
    description,
  }: {
    authorId: string;
    bookId: string | null;
    subject: string;
    description: string;
  }) {
    return db.transaction(async (tx) => {
      const insertedData = await tx
        .insert(ticketTable)
        .values({
          authorId,
          bookId,
          subject,
          description,
        })
        .returning(authorTicketBaseColumns);

      const ticket = insertedData[0];

      await tx.insert(ticketActivityTable).values({
        ticketId: ticket.id,
        type: "created",
        actorType: "author",
        toValue: ticket.status,
      });

      return ticket;
    });
  }

  // Applies the AI's category and priority, unless an admin already set that
  // field by hand while the model was still running
  static async updateAiClassification({
    id,
    category,
    priority,
  }: {
    id: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          category: ticketTable.category,
          priority: ticketTable.priority,
        })
        .from(ticketTable)
        .where(eq(ticketTable.id, id))
        .for("update");
      if (!current) {
        return;
      }

      const adminChanges = await tx
        .select({ type: ticketActivityTable.type })
        .from(ticketActivityTable)
        .where(
          and(
            eq(ticketActivityTable.ticketId, id),
            eq(ticketActivityTable.actorType, "admin"),
            inArray(ticketActivityTable.type, [
              "category_changed",
              "priority_changed",
            ]),
          ),
        );
      const adminChangedTypes = new Set(adminChanges.map((row) => row.type));

      const changes = [
        {
          type: "category_changed",
          from: current.category,
          to: adminChangedTypes.has("category_changed") ? undefined : category,
        },
        {
          type: "priority_changed",
          from: current.priority,
          to: adminChangedTypes.has("priority_changed") ? undefined : priority,
        },
      ] as const;
      const applied = changes.filter(
        (change) => change.to !== undefined && change.to !== change.from,
      );
      if (applied.length === 0) {
        return;
      }

      await tx
        .update(ticketTable)
        .set({
          category: changes[0].to,
          priority: changes[1].to,
        })
        .where(eq(ticketTable.id, id));

      await tx.insert(ticketActivityTable).values(
        applied.map((change) => ({
          ticketId: id,
          type: change.type,
          actorType: "system" as const,
          fromValue: change.from,
          toValue: change.to,
        })),
      );
    });
  }

  static async updateAiResponse({
    id,
    aiResponse,
  }: {
    id: string;
    aiResponse: string;
  }) {
    await db
      .update(ticketTable)
      .set({ aiResponse })
      .where(eq(ticketTable.id, id));
  }

  // Everything an admin needs to work a ticket, including internal fields
  static async getByIdForAdmin({ id }: { id: string }) {
    const data = await db
      .select({
        id: ticketTable.id,
        subject: ticketTable.subject,
        description: ticketTable.description,
        status: ticketTable.status,
        priority: ticketTable.priority,
        category: ticketTable.category,
        responseMessage: ticketTable.responseMessage,
        aiResponse: ticketTable.aiResponse,
        createdAt: ticketTable.createdAt,
        updatedAt: ticketTable.updatedAt,
        book: {
          id: bookTable.id,
          title: bookTable.title,
          isbn: bookTable.isbn,
          status: bookTable.status,
        },
        author: {
          id: authorTable.id,
          name: authorTable.name,
          email: authorTable.email,
          phone: authorTable.phone,
          city: authorTable.city,
          joinedDate: authorTable.joinedDate,
        },
        assignee: {
          id: adminTable.id,
          name: adminTable.name,
          email: adminTable.email,
        },
      })
      .from(ticketTable)
      .innerJoin(authorTable, eq(ticketTable.authorId, authorTable.id))
      .leftJoin(adminTable, eq(ticketTable.assignedTo, adminTable.id))
      .leftJoin(bookTable, eq(ticketTable.bookId, bookTable.id))
      .where(eq(ticketTable.id, id))
      .limit(1);

    return data[0];
  }

  // Records an activity row for every field that actually changed
  static async updateByAdmin({
    id,
    adminId,
    status,
    priority,
    category,
    assignedTo,
    responseMessage,
  }: {
    id: string;
    adminId: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    assignedTo?: string | null;
    responseMessage?: string | null;
  }) {
    await db.transaction(async (tx) => {
      // Locks the row so concurrent saves can't record the same "from" value
      const [current] = await tx
        .select({
          status: ticketTable.status,
          priority: ticketTable.priority,
          category: ticketTable.category,
          assignedTo: ticketTable.assignedTo,
          responseMessage: ticketTable.responseMessage,
        })
        .from(ticketTable)
        .where(eq(ticketTable.id, id))
        .for("update");
      if (!current) {
        return;
      }

      // undefined fields are left untouched by drizzle
      await tx
        .update(ticketTable)
        .set({ status, priority, category, assignedTo, responseMessage })
        .where(eq(ticketTable.id, id));

      const changes = [
        { type: "status_changed", from: current.status, to: status },
        { type: "priority_changed", from: current.priority, to: priority },
        { type: "category_changed", from: current.category, to: category },
        { type: "assignee_changed", from: current.assignedTo, to: assignedTo },
        {
          type: "response_updated",
          from: current.responseMessage,
          to: responseMessage,
        },
      ] as const;

      const activityRows = changes
        .filter(
          (change) => change.to !== undefined && change.to !== change.from,
        )
        .map((change) => ({
          ticketId: id,
          type: change.type,
          actorType: "admin" as const,
          actorAdminId: adminId,
          fromValue: change.from,
          toValue: change.to ?? null,
        }));

      if (activityRows.length > 0) {
        await tx.insert(ticketActivityTable).values(activityRows);
      }
    });
  }
}
