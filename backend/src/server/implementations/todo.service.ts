import apiSchema from "@/api.schema";
import { ServiceImplementationBuilder } from "zynapse/server";

// In-memory todo storage (replace with database in production)
interface Todo {
	id: string;
	title: string;
	completed: boolean;
	createdAt: string;
}

const todos: Map<string, Todo> = new Map();

// Event emitter for real-time updates
type TodoEvent = {
	event: "created" | "updated" | "deleted";
	todo?: Todo;
};

const todoSubscribers: Set<(event: TodoEvent) => void> = new Set();

function emitTodoEvent(event: TodoEvent) {
	todoSubscribers.forEach((subscriber) => subscriber(event));
}

const todoImplementation = new ServiceImplementationBuilder(
	apiSchema.services.Todo,
)
	// QUERY: Get all todos
	.registerProcedureImplementation("GetTodos", async (input) => {
		const allTodos = Array.from(todos.values());
		const { limit = 100, offset = 0 } = input;

		const paginatedTodos = allTodos.slice(offset, offset + limit);

		return {
			todos: paginatedTodos,
			total: allTodos.length,
		};
	})
	// QUERY: Get a single todo by ID
	.registerProcedureImplementation("GetTodoById", async (input) => {
		const todo = todos.get(input.id);

		if (!todo) {
			throw new Error(`Todo with ID ${input.id} not found`);
		}

		return todo;
	})
	// MUTATION: Create a new todo
	.registerProcedureImplementation("CreateTodo", async (input) => {
		const newTodo: Todo = {
			id: crypto.randomUUID(),
			title: input.title,
			completed: false,
			createdAt: new Date().toISOString(),
		};

		todos.set(newTodo.id, newTodo);

		// Emit event for subscriptions
		emitTodoEvent({ event: "created", todo: newTodo });

		return newTodo;
	})
	// MUTATION: Update a todo
	.registerProcedureImplementation("UpdateTodo", async (input) => {
		const todo = todos.get(input.id);

		if (!todo) {
			throw new Error(`Todo with ID ${input.id} not found`);
		}

		const updatedTodo: Todo = {
			...todo,
			title: input.title ?? todo.title,
			completed: input.completed ?? todo.completed,
		};

		todos.set(input.id, updatedTodo);

		// Emit event for subscriptions
		emitTodoEvent({ event: "updated", todo: updatedTodo });

		return updatedTodo;
	})
	// MUTATION: Delete a todo
	.registerProcedureImplementation("DeleteTodo", async (input) => {
		const todo = todos.get(input.id);

		if (!todo) {
			throw new Error(`Todo with ID ${input.id} not found`);
		}

		todos.delete(input.id);

		// Emit event for subscriptions
		emitTodoEvent({ event: "deleted", todo });

		return { success: true };
	})
	// SUBSCRIPTION: Watch for todo updates
	.registerProcedureImplementation(
		"WatchTodos",
		async function (input, req, ctx, conn) {
			const filter = input.filter || "all";

			const subscriber = (event: TodoEvent) => {
				// Apply filter
				if (filter !== "all" && event.todo) {
					if (filter === "completed" && !event.todo.completed) return;
					if (filter === "pending" && event.todo.completed) return;
				}

				// Send event to client
				conn.write(event);
			};

			// Add subscriber
			todoSubscribers.add(subscriber);

			// Clean up on close
			conn.onClose(() => {
				todoSubscribers.delete(subscriber);
			});

			// Keep connection alive - don't close automatically
			// The connection will stay open until the client disconnects
		},
	)
	// BIDIRECTIONAL: Live todo collaboration
	.registerProcedureImplementation("CollaborateTodo", async (req, conn) => {
		console.log("Client connected for collaboration");

		conn.addOnCloseMessageListener(async () => {
			console.log("Collaboration session ended");
		});

		conn.addOnMessageListener({
			name: "TodoCollaboration",
			callback: async (conn, input) => {
				console.log("Received collaboration action:", input);

				try {
					const todo = todos.get(input.todoId);

					if (!todo) {
						await conn.sendMessage({
							success: false,
							message: `Todo with ID ${input.todoId} not found`,
						});
						return;
					}

					let updatedTodo: Todo = todo;

					switch (input.action) {
						case "edit":
							if (input.data?.title) {
								updatedTodo = { ...todo, title: input.data.title };
								todos.set(input.todoId, updatedTodo);
								emitTodoEvent({ event: "updated", todo: updatedTodo });
							}
							break;
						case "complete":
							updatedTodo = { ...todo, completed: true };
							todos.set(input.todoId, updatedTodo);
							emitTodoEvent({ event: "updated", todo: updatedTodo });
							break;
						case "delete":
							todos.delete(input.todoId);
							emitTodoEvent({ event: "deleted", todo });
							break;
					}

					await conn.sendMessage({
						success: true,
						message: `Todo ${input.action} successful`,
						updatedTodo,
					});
				} catch (error) {
					await conn.sendMessage({
						success: false,
						message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
					});
				}
			},
		});

		return undefined;
	})
	.build();

export { todoImplementation };
