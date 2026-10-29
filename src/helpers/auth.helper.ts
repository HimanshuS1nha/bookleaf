import "server-only";

import { cookies } from "next/headers";
import z from "zod";

import { AdminDal } from "@/dal/admin.dal";
import { AuthorDal } from "@/dal/author.dal";

import { JWTHelper } from "@/helpers/jwt.helper";

import { Role } from "@/enums/role.enum";

import { AdminType, AuthorType } from "@/types";

const tokenPayloadValidator = z.object({
  sub: z.string(),
  role: z.enum(Role),
});

export class AuthHelper {
  static async signToken({ id, role }: { id: string; role: Role }) {
    return await JWTHelper.sign({
      subject: id,
      data: { role },
      expirationTime: "15d",
    });
  }

  static async setTokenCookie({ token }: { token: string }) {
    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60,
    });
  }

  static async clearTokenCookie() {
    const cookieStore = await cookies();

    cookieStore.delete("token");
  }

  private static async getTokenPayload() {
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;
    if (!token) {
      return null;
    }

    const payload = await JWTHelper.verify({ token }).catch(() => null);
    if (!payload) {
      return null;
    }

    const parsingResult = tokenPayloadValidator.safeParse(payload);
    if (!parsingResult.success) {
      return null;
    }

    return parsingResult.data;
  }

  private static async getAuthorById({
    id,
  }: {
    id: string;
  }): Promise<AuthorType | null> {
    const author = await AuthorDal.getById({ id });
    if (!author) {
      return null;
    }

    return {
      id: author.id,
      name: author.name,
      email: author.email,
      city: author.city,
      phone: author.phone,
      joinedDate: author.joinedDate,
      role: Role.AUTHOR,
    };
  }

  private static async getAdminById({
    id,
  }: {
    id: string;
  }): Promise<AdminType | null> {
    const admin = await AdminDal.getById({ id });
    if (!admin) {
      return null;
    }

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: Role.ADMIN,
    };
  }

  // The token only identifies the account, everything else is read from the db
  static async getAccountFromToken(): Promise<AuthorType | AdminType | null> {
    const payload = await AuthHelper.getTokenPayload();
    if (!payload) {
      return null;
    }

    return payload.role === Role.ADMIN
      ? AuthHelper.getAdminById({ id: payload.sub })
      : AuthHelper.getAuthorById({ id: payload.sub });
  }

  static async getAuthorFromToken(): Promise<AuthorType | null> {
    const payload = await AuthHelper.getTokenPayload();
    if (!payload || payload.role !== Role.AUTHOR) {
      return null;
    }

    return AuthHelper.getAuthorById({ id: payload.sub });
  }

  static async getAdminFromToken(): Promise<AdminType | null> {
    const payload = await AuthHelper.getTokenPayload();
    if (!payload || payload.role !== Role.ADMIN) {
      return null;
    }

    return AuthHelper.getAdminById({ id: payload.sub });
  }
}
