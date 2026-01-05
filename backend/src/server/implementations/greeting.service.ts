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
	.registerProcedureImplementation("SendMessage", async (input) => {
		console.log("Received message:", input.message);
		// Here you could save to database, send notification, etc.
		return {
			status: true,
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
	.registerProcedureImplementation("echo", async (req, conn) => {
		conn.addOnCloseMessageListener(async () => {
			console.log("Bye bye!");
		});
		conn.addOnMessageListener({
			name: "Test",
			callback: async (conn, { msg }) => {
				console.log("Received", msg);
				await conn.sendMessage({
					msg: `Echo: ${msg}`,
				});
				await conn.close();
			},
		});

		return undefined;
	})
	.build();

export { greetingImplementation };
