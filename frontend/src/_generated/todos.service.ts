import {useMutation, UseMutationOptions} from "@tanstack/react-query";
import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import {z} from "zod"

// ---- Service Name: Todos ----
export type TodosCreateTodoOutputType = {
  id: string;
  title: string;
  completed?: boolean;
  /** Timestamp of todo creation */
  createdAt: Date;
  /** Timestamp of last todo update */
  updatedAt: Date;
  /** ID of the user who owns this todo */
  userId: string;
};
export const TodosCreateTodoInputSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(255, "Title is too long"),
  })
  .strict();
export function useTodosCreateTodoMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      TodosCreateTodoOutputType,
      Error,
      z.infer<typeof TodosCreateTodoInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
) {
  /*Creates a new todo item for the authenticated user. The 'userId' is automatically inferred from the session. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof TodosCreateTodoInputSchema>) => {
      const validationResult =
        await TodosCreateTodoInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on validating mutation input ",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Todos",
          procedure: "CreateTodo",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Mutation error");
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as TodosCreateTodoOutputType;
    },
  });
}

export const TodosGetAllTodosQueryInputSchema = z
  .object({
    /**Filter todos by completion status*/
    completed: z
      .boolean()
      .describe("Filter todos by completion status")
      .optional(),
    /**Number of todos per page (1-100, default 20)*/
    limit: z
      .number()
      .int()
      .gte(1)
      .lte(100)
      .describe("Number of todos per page (1-100, default 20)")
      .default(20),
    /**Offset for pagination (default 0)*/
    offset: z
      .number()
      .int()
      .gte(0)
      .describe("Offset for pagination (default 0)")
      .default(0),
    /**Field to sort by (createdAt, updatedAt, title)*/
    sortBy: z
      .enum(["createdAt", "updatedAt", "title"])
      .describe("Field to sort by (createdAt, updatedAt, title)")
      .default("createdAt"),
    /**Sort direction (asc, desc)*/
    sortDirection: z
      .enum(["asc", "desc"])
      .describe("Sort direction (asc, desc)")
      .default("desc"),
  })
  .strict();
export type TodosGetAllTodosOutputType = {
  todos: {
    id: string;
    title: string;
    completed?: boolean;
    /** Timestamp of todo creation */
    createdAt: Date;
    /** Timestamp of last todo update */
    updatedAt: Date;
    /** ID of the user who owns this todo */
    userId: string;
  }[];
  /** Total number of todos matching criteria (before pagination) */
  total: number;
  /** Indicates if more todos are available beyond the current page */
  hasMore: boolean;
};

export function useTodosGetAllTodosQuery(
  args: z.infer<typeof TodosGetAllTodosQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      TodosGetAllTodosOutputType,
      Error,
      TodosGetAllTodosOutputType,
      Array<string>
    >,
    "queryKey" | "queryFn"
  >,
) {
  /*Retrieves all todo items for the authenticated user. Supports pagination, sorting, and filtering by completion status. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.*/
  return useQuery({
    queryKey: ["Todos", "GetAllTodos"],
    queryFn: async () => {
      const validationResult =
        await TodosGetAllTodosQueryInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on input validation of GetAllTodos",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Todos",
          procedure: "GetAllTodos",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Non ok response");
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as TodosGetAllTodosOutputType;
    },
    ...extraOptions,
  });
}

export const TodosGetTodoByIdQueryInputSchema = z
  .object({ id: z.string().uuid("Invalid todo ID format") })
  .strict();
export type TodosGetTodoByIdOutputType = {
  id: string;
  title: string;
  completed?: boolean;
  /** Timestamp of todo creation */
  createdAt: Date;
  /** Timestamp of last todo update */
  updatedAt: Date;
  /** ID of the user who owns this todo */
  userId: string;
};

export function useTodosGetTodoByIdQuery(
  args: z.infer<typeof TodosGetTodoByIdQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      TodosGetTodoByIdOutputType,
      Error,
      TodosGetTodoByIdOutputType,
      Array<string>
    >,
    "queryKey" | "queryFn"
  >,
) {
  /*Retrieves a specific todo item by its ID for the authenticated user. Responds with 404 if the todo is not found or does not belong to the user. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.*/
  return useQuery({
    queryKey: ["Todos", "GetTodoById"],
    queryFn: async () => {
      const validationResult =
        await TodosGetTodoByIdQueryInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on input validation of GetTodoById",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Todos",
          procedure: "GetTodoById",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Non ok response");
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as TodosGetTodoByIdOutputType;
    },
    ...extraOptions,
  });
}

export type TodosUpdateTodoOutputType = {
  id: string;
  title: string;
  completed?: boolean;
  /** Timestamp of todo creation */
  createdAt: Date;
  /** Timestamp of last todo update */
  updatedAt: Date;
  /** ID of the user who owns this todo */
  userId: string;
};
export const TodosUpdateTodoInputSchema = z
  .object({
    id: z.string().uuid("Invalid todo ID format"),
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(255, "Title is too long")
      .optional(),
    completed: z.boolean().optional(),
  })
  .strict();
export function useTodosUpdateTodoMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      TodosUpdateTodoOutputType,
      Error,
      z.infer<typeof TodosUpdateTodoInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
) {
  /*Updates an existing todo item (title and/or completion status) for the authenticated user. At least one modifiable field (title or completed) must be provided. Responds with 404 if the todo is not found or does not belong to the user. Responds with 400 if no updatable fields are provided. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof TodosUpdateTodoInputSchema>) => {
      const validationResult =
        await TodosUpdateTodoInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on validating mutation input ",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Todos",
          procedure: "UpdateTodo",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Mutation error");
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as TodosUpdateTodoOutputType;
    },
  });
}

export type TodosDeleteTodoOutputType = {
  success: boolean;
  /** ID of the deleted todo */
  id: string;
};
export const TodosDeleteTodoInputSchema = z
  .object({ id: z.string().uuid("Invalid todo ID format") })
  .strict();
export function useTodosDeleteTodoMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      TodosDeleteTodoOutputType,
      Error,
      z.infer<typeof TodosDeleteTodoInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
) {
  /*Deletes a todo item by its ID for the authenticated user. Responds with 404 if the todo is not found or does not belong to the user. Responds with 401 if unauthorized. May refresh 'auth_session' cookie.*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof TodosDeleteTodoInputSchema>) => {
      const validationResult =
        await TodosDeleteTodoInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on validating mutation input ",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Todos",
          procedure: "DeleteTodo",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Mutation error");
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as TodosDeleteTodoOutputType;
    },
  });
}
//----