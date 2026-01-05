import { Server } from "zynapse/server";
import apiSchema from "@/api.schema";
import { greetingImplementation } from "./implementations/greeting.service";
import { todoImplementation } from "./implementations/todo.service";

const server = new Server(apiSchema, {
	Greeting: greetingImplementation,
	Todo: todoImplementation,
});

server.registerWebhookHandler(async function (req) {
	console.log(`Webhook received\n${await req.text()}`);
	return new Response(null, {
		status: 200,
	});
});

server.start();
