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

const schema = new APISchema({
	Greeting: helloWorldService,
});

export default schema;
