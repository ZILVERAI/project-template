import { drizzle } from "drizzle-orm/postgres-js";

export const client = drizzle(process.env.DATABASE_URL!);

const result = await client.execute("select 1");
