import { APISchema, Service } from "zynapse/schema";
import { z } from "zod";

// COMMENT: Shared schemas for user and todo entities.
// These define the basic data structures used across services.

const userSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Name must not be empty"),
	email: z.string().email("Invalid email format"),
	role: z
		.enum(["user", "admin"])
		.default("user")
		.describe("User role, defaults to 'user'"),
	createdAt: z.date().describe("Timestamp of user creation"),
	updatedAt: z.date().describe("Timestamp of last user update"),
});

const todoSchema = z.object({
	id: z.string().uuid(),
	title: z
		.string()
		.min(1, "Title must not be empty")
		.max(255, "Title cannot exceed 255 characters"),
	completed: z.boolean().default(false),
	createdAt: z.date().describe("Timestamp of todo creation"),
	updatedAt: z.date().describe("Timestamp of last todo update"),
	userId: z.string().uuid().describe("ID of the user who owns this todo"),
});

// COMMENT: This service handles user authentication, registration, and session management.
// It is responsible for issuing and clearing authentication cookies.
const authService = new Service("Auth")
	.addProcedure({
		method: "MUTATION",
		name: "Register",
		description:
			"Registers a new user. On success, automatically logs the user in and sets an 'auth_session' cookie (HttpOnly, Secure, SameSite=Lax) valid for 24 hours. Responds with 409 if email is already taken. This procedure always sets a new 'auth_session' cookie in the response on successful registration.",
		// COMMENT: Use this endpoint for new user sign-ups.
		// Input: User's desired name, email, and password.
		// Output: Newly created user's details (excluding password).
		input: z.object({
			name: z.string().min(1, "Name is required"),
			email: z.string().email("Invalid email address"),
			password: z.string().min(8, "Password must be at least 8 characters"),
		}),
		output: z.object({
			user: userSchema,
		}),
	})
	.addProcedure({
		method: "MUTATION",
		name: "Login",
		description:
			"Authenticates a user with email and password. Sets an 'auth_session' cookie (HttpOnly, Secure, SameSite=Lax) valid for 24 hours. Responds with 401 if credentials are invalid. This procedure always sets a new 'auth_session' cookie in the response on successful login.",
		// COMMENT: Use this endpoint for existing user sign-ins.
		// Input: User's email and password.
		// Output: Authenticated user's details.
		input: z.object({
			email: z.string().email("Invalid email address"),
			password: z.string().min(8, "Password cannot be less than 8 characters"),
		}),
		output: z.object({
			user: userSchema,
		}),
	})
	.addProcedure({
		method: "MUTATION",
		name: "Logout",
		description:
			"Invalidates the current user session by clearing the 'auth_session' cookie. Sets an expired 'auth_session' cookie to ensure client deletion. Always returns success, even if no session was active.",
		// COMMENT: Use this endpoint to sign out the current user.
		// Input: None.
		// Output: Confirmation of successful logout.
		input: z.object({}),
		output: z.object({
			success: z.boolean(),
		}),
	})
	.addProcedure({
		method: "QUERY",
		name: "GetProfile",
		description:
			"Retrieves the profile of the currently authenticated user based on the 'auth_session' cookie. Responds with 401 if no valid session is found. If the session is nearing expiration (e.g., less than 1 hour left), it may be refreshed, and a new 'auth_session' cookie will be set in the response.",
		// COMMENT: Use this endpoint to fetch the current authenticated user's data.
		// Relies on a valid 'auth_session' cookie being sent by the client.
		// Input: None.
		// Output: Current user's details.
		input: z.object({}),
		output: userSchema,
	});

// COMMENT: This service manages todo items for authenticated users.
// All procedures in this service require a valid user session via the 'auth_session' cookie.
const todosService = new Service("Todos")
	.setMiddlewareDescription(
		"Requires 'auth_session' cookie with a valid session token. The session must contain 'userId' to scope todo operations to the authenticated user. The session cookie is HTTP-only, secure, and typically has a SameSite=Lax attribute. If the session is valid but nearing expiration (e.g., less than 1 hour remaining), it will be automatically refreshed, and a new 'auth_session' cookie will be set in the response.",
	)
	.addProcedure({
		method: "MUTATION",
		name: "CreateTodo",
		description:
			"Creates a new todo item for the authenticated user. The 'userId' is automatically inferred from the session. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.",
		// COMMENT: Use this endpoint to add a new task to the user's list.
		// Input: Title of the new todo.
		// Output: The newly created todo item.
		input: z.object({
			title: z
				.string()
				.min(1, "Title cannot be empty")
				.max(255, "Title is too long"),
		}),
		output: todoSchema,
	})
	.addProcedure({
		method: "QUERY",
		name: "GetAllTodos",
		description:
			"Retrieves all todo items for the authenticated user. Supports pagination, sorting, and filtering by completion status. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.",
		// COMMENT: Use this endpoint to fetch a list of todos, typically for display.
		// Supports filtering by 'completed' status and pagination ('limit', 'offset').
		// Supports sorting by 'createdAt', 'updatedAt', or 'title'.
		input: z.object({
			completed: z
				.boolean()
				.optional()
				.describe("Filter todos by completion status"),
			limit: z
				.number()
				.int()
				.min(1)
				.max(100)
				.optional()
				.default(20)
				.describe("Number of todos per page (1-100, default 20)"),
			offset: z
				.number()
				.int()
				.min(0)
				.optional()
				.default(0)
				.describe("Offset for pagination (default 0)"),
			sortBy: z
				.enum(["createdAt", "updatedAt", "title"])
				.optional()
				.default("createdAt")
				.describe("Field to sort by (createdAt, updatedAt, title)"),
			sortDirection: z
				.enum(["asc", "desc"])
				.optional()
				.default("desc")
				.describe("Sort direction (asc, desc)"),
		}),
		output: z.object({
			todos: z.array(todoSchema),
			total: z
				.number()
				.int()
				.nonnegative()
				.describe(
					"Total number of todos matching criteria (before pagination)",
				),
			hasMore: z
				.boolean()
				.describe(
					"Indicates if more todos are available beyond the current page",
				),
		}),
	})
	.addProcedure({
		method: "QUERY",
		name: "GetTodoById",
		description:
			"Retrieves a specific todo item by its ID for the authenticated user. Responds with 404 if the todo is not found or does not belong to the user. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.",
		// COMMENT: Use this endpoint to fetch details for a single todo item.
		// Input: ID of the todo to retrieve.
		// Output: The specified todo item.
		input: z.object({
			id: z.string().uuid("Invalid todo ID format"),
		}),
		output: todoSchema,
	})
	.addProcedure({
		method: "MUTATION",
		name: "UpdateTodo",
		description:
			"Updates an existing todo item (title and/or completion status) for the authenticated user. At least one modifiable field (title or completed) must be provided. Responds with 404 if the todo is not found or does not belong to the user. Responds with 400 if no updatable fields are provided. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.",
		// COMMENT: Use this endpoint to modify an existing todo (e.g., change title, mark as complete/incomplete).
		// Input: ID of the todo and the fields to update (title, completed).
		// Output: The updated todo item.
		input: z
			.object({
				id: z.string().uuid("Invalid todo ID format"),
				title: z
					.string()
					.min(1, "Title cannot be empty")
					.max(255, "Title is too long")
					.optional(),
				completed: z.boolean().optional(),
			})
			.refine(
				(data) => data.title !== undefined || data.completed !== undefined,
				{
					message:
						"At least one field (title or completed) must be provided for update.",
				},
			),
		output: todoSchema,
	})
	.addProcedure({
		method: "MUTATION",
		name: "DeleteTodo",
		description:
			"Deletes a todo item by its ID for the authenticated user. Responds with 404 if the todo is not found or does not belong to the user. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.",
		// COMMENT: Use this endpoint to permanently remove a todo item.
		// Input: ID of the todo to delete.
		// Output: Confirmation of successful deletion and the ID of the deleted todo.
		input: z.object({
			id: z.string().uuid("Invalid todo ID format"),
		}),
		output: z.object({
			success: z.boolean(),
			id: z.string().uuid().describe("ID of the deleted todo"),
		}),
	});

// COMMENT: This is the main API schema for the Todo application.
// It aggregates all defined services.
const apiSchema = new APISchema({
	Auth: authService,
	Todos: todosService,
});

export default apiSchema;
