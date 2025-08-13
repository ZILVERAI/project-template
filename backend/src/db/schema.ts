import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const usersTable = pgTable("users_table", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
});
