import { APISchema, Service } from "zynapse/schema";
import { z } from "zod";

const schema: APISchema = new APISchema();
// This is my schema!
const usersService = new Service("Users")
	.addProcedure({
		method: "QUERY",
		name: "GetUserById",
		description: "Get the user object by using its id.",
		input: z.object({
			id: z.string().uuid(),
		}),
		output: z.object({
			id: z.string().uuid(),
			userName: z.string(),
			email: z.string(),
		}),
	})
	.addProcedure({
		method: "MUTATION",
		name: "ChangeUsername",
		description: "Change a specific user's name using its id",
		input: z.object({
			id: z.string().uuid(),
			newName: z.string().min(1).max(255),
		}),
		output: z.boolean(),
	})
	.addProcedure({
		method: "MUTATION",
		name: "DeleteUser",
		description: "Deletes and user's account",
		input: z.object({
			id: z.string().uuid(),
		}),
		output: z.object({
			deleteTime: z.date(),
		}),
	});

// Adding a new method to the API

schema.registerService(usersService);

export default schema;
