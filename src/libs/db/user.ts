import { db } from ".";

export function init() {
  db.schema
    .createTable("users")
    .ifNotExists()
    .addColumn("id", "text", (cb) => cb.primaryKey())
    .addColumn("name", "text")
    .addColumn("email", "text")
    .addColumn("password", "text", (cb) => cb.notNull())
    .addColumn("avatar", "text")
    .addColumn("refreshToken", "text")
    .execute();
}

export interface UserTable {
  id: string;
  name?: string;
  email?: string;
  password: string;
  avatar?: string;
  refreshToken?: string;
}

export async function getUser(id: string) {
  const query = await db
    .selectFrom("users")
    .select(["id", "name", "email", "avatar"])
    .where("id", "=", id)
    .executeTakeFirst();

  if (!query) {
    return null;
  }

  return query;
}
