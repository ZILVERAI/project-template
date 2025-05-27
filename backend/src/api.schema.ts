import { APISchema, Service } from "zynapse/schema";
import { z } from "zod";

const greetingService = new Service("Greeting").addProcedure({
	description: "Says hello and the name.",
	input: z.object({
		name: z.string(),
	}),
	method: "QUERY",
	name: "SayHello",
	output: z.object({
		greeting: z.string(),
	}),
});

// COMMENT: This is the main API schema for the Todo application.
// It aggregates all defined services.
const apiSchema = new APISchema({
	Greeting: greetingService,
});

export default apiSchema;
