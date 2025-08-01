import { Server } from "zynapse/server";
import apiSchema from "@/api.schema";
import { greetingImplementation } from "./implementations/greeting.service";
import { client } from "@/utils/db";
import { usersTable } from "@/db/schema";

const server = new Server(apiSchema, {
	Greeting: greetingImplementation,
});

server.start();
