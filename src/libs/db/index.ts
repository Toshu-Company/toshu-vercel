import { createKysely } from "@vercel/postgres-kysely";
import { UserTable } from "./user";

export interface Database {
  users: UserTable;
}

export const db = createKysely<Database>();
export { sql } from "kysely";
export * from "./user";

import("./user").then(({ init }) => init());
