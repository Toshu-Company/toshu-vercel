import { Generated, sql } from "kysely";
import { db } from ".";

export function init() {
  db.schema
    .createTable("userdata")
    .ifNotExists()
    .addColumn("id", "serial", (cb) => cb.primaryKey())
    .addColumn("data", "jsonb", (cb) => cb.notNull().defaultTo(sql`'[]'`))
    .addColumn("user", "text", (cb) =>
      cb.references("users.id").notNull().unique()
    )
    .execute();
}

export interface UserDataTable {
  id: Generated<number>;

  data: UserData;

  user: string;
}

export interface UserData {
  favorites: number[];
}

export function getUserdata(userid: string) {
  return db
    .selectFrom("userdata")
    .select(["data", "user"])
    .where("user", "=", userid)
    .executeTakeFirst();
}

export function setUserdata(user: string, data: UserData) {
  return db
    .insertInto("userdata")
    .values({ user, data })
    .onConflict((oc) => oc.column("user").doUpdateSet({ data }))
    .execute();
}
