import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";

import { authorTable } from "@/db/schema";

export class AuthorDal {
  static async getById({ id }: { id: string }) {
    const data = await db
      .select({
        id: authorTable.id,
        name: authorTable.name,
        email: authorTable.email,
        city: authorTable.city,
        phone: authorTable.phone,
        joinedDate: authorTable.joinedDate,
        createdAt: authorTable.createdAt,
      })
      .from(authorTable)
      .where(eq(authorTable.id, id))
      .limit(1);

    return data[0];
  }

  static async getByEmail({ email }: { email: string }) {
    const data = await db
      .select({
        id: authorTable.id,
        name: authorTable.name,
        email: authorTable.email,
        city: authorTable.city,
        phone: authorTable.phone,
        joinedDate: authorTable.joinedDate,
        createdAt: authorTable.createdAt,
      })
      .from(authorTable)
      .where(eq(authorTable.email, email))
      .limit(1);

    return data[0];
  }

  // Sensitive as it returns passwordHash
  static async INTERNAL_getByEmail({ email }: { email: string }) {
    const data = await db
      .select({
        id: authorTable.id,
        name: authorTable.name,
        email: authorTable.email,
        city: authorTable.city,
        phone: authorTable.phone,
        joinedDate: authorTable.joinedDate,
        passwordHash: authorTable.passwordHash,
        createdAt: authorTable.createdAt,
      })
      .from(authorTable)
      .where(eq(authorTable.email, email))
      .limit(1);

    return data[0];
  }

  static async create({
    email,
    name,
    passwordHash,
    city,
    phone,
  }: {
    name: string;
    email: string;
    passwordHash: string;
    city: string;
    phone: string;
  }) {
    const insertedData = await db
      .insert(authorTable)
      .values({
        name,
        email,
        passwordHash,
        city,
        phone,
      })
      .returning({
        id: authorTable.id,
        name: authorTable.name,
        email: authorTable.email,
        city: authorTable.city,
        phone: authorTable.phone,
        joinedDate: authorTable.joinedDate,
        createdAt: authorTable.createdAt,
      });

    return insertedData[0];
  }
}
