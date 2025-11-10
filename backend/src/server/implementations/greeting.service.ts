import apiSchema from "@/api.schema";
import { ServiceImplementationBuilder } from "zynapse/server";

const greetingImplementation = new ServiceImplementationBuilder(
	apiSchema.services.Greeting,
)
	.registerProcedureImplementation("SayHello", async (input) => {
		return {
			greeting: { msg: `Hello ${input.name}` },
		};
	})
	.registerProcedureImplementation(
		"StreamedName",
		async function (input, req, ctx, conn) {
			for (const letter of input.name.split("")) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await conn.write(letter);
			}
			await conn.close();
		},
	)
	.build();

export { greetingImplementation };
