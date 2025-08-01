import { drizzle } from "drizzle-orm/libsql";

export const client = drizzle({
	connection: {
		url: process.env.DATABASE_URL!,
	},
});
