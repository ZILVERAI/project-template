import { drizzle } from "drizzle-orm/postgres-js";

export const client = drizzle(process.env.DATABASE_URL!);
