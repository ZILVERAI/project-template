import { APISchema, Service } from "zynapse/schema";
import { z } from "zod";

const greetingService = new Service("Greeting")
	.addProcedure({
		description: "Says hello and the name.",
		input: z.object({
			name: z.record(z.string()),
		}),
		method: "QUERY",
		name: "SayHello",
		output: z.object({
			greeting: z.record(z.string()),
		}),
	})
	.addProcedure({
		description: "Says hello and the name.",
		input: z.object({
			message: z.string(),
		}),
		method: "MUTATION",
		name: "SendMessage",
		output: z.object({
			status: z.boolean(),
		}),
	})
	.addProcedure({
		description: "Streams the given name, letter by letter.",
		input: z.object({
			name: z.string(),
		}),
		method: "SUBSCRIPTION",
		name: "StreamedName",
		output: z.string(),
	})
	.addProcedure({
		description: "Echo's back the given message",
		input: z.object({
			msg: z.string(),
		}),
		method: "BIDIRECTIONAL",
		name: "echo",
		output: z.object({
			msg: z.string(),
		}),
	});

// Example Todo service demonstrating all 4 method types
const todoService = new Service("Todo")
	// QUERY: Fetch all todos
	.addProcedure({
		description: "Retrieves all todos from the database",
		input: z.object({
			limit: z.number().optional(),
			offset: z.number().optional(),
		}),
		method: "QUERY",
		name: "GetTodos",
		output: z.object({
			todos: z.array(
				z.object({
					id: z.string(),
					title: z.string(),
					completed: z.boolean(),
					createdAt: z.string(),
				}),
			),
			total: z.number(),
		}),
	})
	// QUERY: Get a single todo by ID
	.addProcedure({
		description: "Retrieves a single todo by its ID",
		input: z.object({
			id: z.string(),
		}),
		method: "QUERY",
		name: "GetTodoById",
		output: z.object({
			id: z.string(),
			title: z.string(),
			completed: z.boolean(),
			createdAt: z.string(),
		}),
	})
	// MUTATION: Create a new todo
	.addProcedure({
		description: "Creates a new todo item",
		input: z.object({
			title: z.string().min(1).max(200),
		}),
		method: "MUTATION",
		name: "CreateTodo",
		output: z.object({
			id: z.string(),
			title: z.string(),
			completed: z.boolean(),
			createdAt: z.string(),
		}),
	})
	// MUTATION: Update a todo
	.addProcedure({
		description: "Updates an existing todo item",
		input: z.object({
			id: z.string(),
			title: z.string().min(1).max(200).optional(),
			completed: z.boolean().optional(),
		}),
		method: "MUTATION",
		name: "UpdateTodo",
		output: z.object({
			id: z.string(),
			title: z.string(),
			completed: z.boolean(),
			createdAt: z.string(),
		}),
	})
	// MUTATION: Delete a todo
	.addProcedure({
		description: "Deletes a todo item by ID",
		input: z.object({
			id: z.string(),
		}),
		method: "MUTATION",
		name: "DeleteTodo",
		output: z.object({
			success: z.boolean(),
		}),
	})
	// SUBSCRIPTION: Watch for todo updates
	.addProcedure({
		description: "Streams real-time updates when todos are created, updated, or deleted",
		input: z.object({
			filter: z.enum(["all", "completed", "pending"]).optional(),
		}),
		method: "SUBSCRIPTION",
		name: "WatchTodos",
		output: z.object({
			event: z.enum(["created", "updated", "deleted"]),
			todo: z.object({
				id: z.string(),
				title: z.string(),
				completed: z.boolean(),
				createdAt: z.string(),
			}).optional(),
		}),
	})
	// BIDIRECTIONAL: Live todo collaboration
	.addProcedure({
		description: "Real-time bidirectional todo collaboration - send and receive todo updates",
		input: z.object({
			action: z.enum(["edit", "complete", "delete"]),
			todoId: z.string(),
			data: z.any().optional(),
		}),
		method: "BIDIRECTIONAL",
		name: "CollaborateTodo",
		output: z.object({
			success: z.boolean(),
			message: z.string(),
			updatedTodo: z.object({
				id: z.string(),
				title: z.string(),
				completed: z.boolean(),
				createdAt: z.string(),
			}).optional(),
		}),
	});

// COMMENT: This is the main API schema for the application.
// It aggregates all defined services.
const apiSchema = new APISchema({
	Greeting: greetingService,
	Todo: todoService,
});

export default apiSchema;
