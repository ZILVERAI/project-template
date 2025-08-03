import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./src/db",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	tablesFilter: ["!schema_migrations"],
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
