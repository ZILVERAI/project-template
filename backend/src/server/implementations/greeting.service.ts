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
	.registerProcedureImplementation("StreamedName", async function* (input) {
		for (const letter of input.name.split("")) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			yield letter;
		}
	})
	.build();

export { greetingImplementation };
