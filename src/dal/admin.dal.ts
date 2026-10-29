import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";

import { adminTable } from "@/db/schema";

export class AdminDal {
  static async getAll() {
    return db
      .select({
        id: adminTable.id,
        name: adminTable.name,
        email: adminTable.email,
      })
      .from(adminTable)
      .orderBy(asc(adminTable.name));
  }

  static async getById({ id }: { id: string }) {
    const data = await db
      .select({
        id: adminTable.id,
        name: adminTable.name,
        email: adminTable.email,
        createdAt: adminTable.createdAt,
      })
      .from(adminTable)
      .where(eq(adminTable.id, id))
      .limit(1);

    return data[0];
  }

  static async getByEmail({ email }: { email: string }) {
    const data = await db
      .select({
        id: adminTable.id,
        name: adminTable.name,
        email: adminTable.email,
        createdAt: adminTable.createdAt,
      })
      .from(adminTable)
      .where(eq(adminTable.email, email))
      .limit(1);

    return data[0];
  }

  // Sensitive as it returns passwordHash
  static async INTERNAL_getByEmail({ email }: { email: string }) {
    const data = await db
      .select({
        id: adminTable.id,
        name: adminTable.name,
        email: adminTable.email,
        passwordHash: adminTable.passwordHash,
        createdAt: adminTable.createdAt,
      })
      .from(adminTable)
      .where(eq(adminTable.email, email))
      .limit(1);

    return data[0];
  }

  static async create({
    email,
    name,
    passwordHash,
  }: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const insertedData = await db
      .insert(adminTable)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning({
        id: adminTable.id,
        name: adminTable.name,
        email: adminTable.email,
        createdAt: adminTable.createdAt,
      });

    return insertedData[0];
  }
}
