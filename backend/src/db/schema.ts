import { sqliteTable, AnySQLiteColumn, integer, text } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const usersTable = sqliteTable("users_table", {
	id: integer().primaryKey({ autoIncrement: true }),
	email: text().notNull(),
});

