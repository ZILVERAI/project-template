import apiSchema from "@/api.schema";
import { ServiceImplementationBuilder } from "zynapse/server";

const greetingImplementation = new ServiceImplementationBuilder(
	apiSchema.services.Greeting,
)
	.registerProcedureImplementation("SayHello", async (input) => {
		return {
			greeting: `Hello ${input.name}`,
		};
	})
	.build();

export { greetingImplementation };
