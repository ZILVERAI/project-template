import { Server } from "zynapse/server";
import apiSchema from "@/api.schema";
import { greetingImplementation } from "./implementations/greeting.service";

const server = new Server(apiSchema, {
	Greeting: greetingImplementation,
});

server.registerWebhookHandler(async function (req) {
	console.log(`Webhook received\n${await req.text()}`);
	return new Response(null, {
		status: 200,
	});
});

server.start();
