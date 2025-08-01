import { Server } from "zynapse/server";
import apiSchema from "@/api.schema";
import { greetingImplementation } from "./implementations/greeting.service";
import { client } from "@/utils/db";
import { usersTable } from "@/db/schema";

const server = new Server(apiSchema, {
	Greeting: greetingImplementation,
});

await client.insert(usersTable).values({
	age: 19,
	email: "asd@asd.com",
	name: "asd",
	something: "asd",
});

server.start();
