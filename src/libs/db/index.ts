import { createKysely } from "@vercel/postgres-kysely";
import { UserTable } from "./user";
import { UserDataTable } from "./userdata";

export interface Database {
  users: UserTable;
  userdata: UserDataTable;
}

export const db = createKysely<Database>();
export { sql } from "kysely";
export * from "./user";

import { init as initUser } from "./user";
import { init as initUserData } from "./userdata";

initUser();
initUserData();
