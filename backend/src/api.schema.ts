import { APISchema, Service } from "zynapse/schema";
import { z } from "zod";

// This is my schema!
const helloWorldService = new Service("Greeting").addProcedure({
	method: "QUERY",
	name: "SayHello",
	description: "Accepts a name and then returns hello to that name",
	input: z.object({
		name: z.string(),
	}),
	output: z.object({
		greeting: z.string(),
	}),
});

const pingService = new Service("Ping").addProcedure({
	method: "QUERY",
	name: "PingRequest",
	description: "Responds with pong.",
	input: z.object({}),
	output: z.literal("pong"),
});

const schema = new APISchema({
	Greeting: helloWorldService,
	Ping: pingService,
});

export default schema;
