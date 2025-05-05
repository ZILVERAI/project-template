import { Server } from "zynapse/server";
import apiSchema from "@/api.schema";
import { greetingImplementation } from "./implementations/greeting.service";

const server = new Server(apiSchema, {
	Greeting: greetingImplementation,
});

server.start();
