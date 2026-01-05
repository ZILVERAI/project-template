import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  useWebSocket,
  UseWebSocketReturn,
  UseWebSocketOptions,
} from "./useWebsocket";
import { z } from "zod";

// ---- Service Name: Todo ----
export const TodoGetTodosQueryInputSchema = z
  .object({ limit: z.number().optional(), offset: z.number().optional() })
  .strict();
export type TodoGetTodosOutputType = {
  todos: {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
  }[];
  total: number;
};

export function useTodoGetTodosQuery(
  args: z.infer<typeof TodoGetTodosQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      TodoGetTodosOutputType,
      Error,
      TodoGetTodosOutputType,
      Array<string | z.infer<typeof TodoGetTodosQueryInputSchema>>
    >,
    "queryKey" | "queryFn"
  >,
  headers?: HeadersInit,
) {
  /*Retrieves all todos from the database*/
  return useQuery({
    queryKey: ["Todo", "GetTodos", args],
    queryFn: async () => {
      const validationResult =
        await TodoGetTodosQueryInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on input validation of GetTodos",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const targetURL = new URL("/_api/Todo/GetTodos", window.location.origin);
      const stringifiedArguments = JSON.stringify(validationResult.data);
      const encodedArguments = encodeURIComponent(stringifiedArguments);
      targetURL.searchParams.set("payload", encodedArguments);

      const response = await fetch(targetURL, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        let backendErrorMessage = "";
        try {
          backendErrorMessage = await response.text();
        } catch {
          backendErrorMessage = "No Error message returned from backen";
        }
        throw new Error(
          "Query: GetTodos Non ok response: " + backendErrorMessage,
        );
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as TodoGetTodosOutputType;
    },
    ...extraOptions,
  });
}

export const TodoGetTodoByIdQueryInputSchema = z
  .object({ id: z.string() })
  .strict();
export type TodoGetTodoByIdOutputType = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export function useTodoGetTodoByIdQuery(
  args: z.infer<typeof TodoGetTodoByIdQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      TodoGetTodoByIdOutputType,
      Error,
      TodoGetTodoByIdOutputType,
      Array<string | z.infer<typeof TodoGetTodoByIdQueryInputSchema>>
    >,
    "queryKey" | "queryFn"
  >,
  headers?: HeadersInit,
) {
  /*Retrieves a single todo by its ID*/
  return useQuery({
    queryKey: ["Todo", "GetTodoById", args],
    queryFn: async () => {
      const validationResult =
        await TodoGetTodoByIdQueryInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on input validation of GetTodoById",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const targetURL = new URL(
        "/_api/Todo/GetTodoById",
        window.location.origin,
      );
      const stringifiedArguments = JSON.stringify(validationResult.data);
      const encodedArguments = encodeURIComponent(stringifiedArguments);
      targetURL.searchParams.set("payload", encodedArguments);

      const response = await fetch(targetURL, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        let backendErrorMessage = "";
        try {
          backendErrorMessage = await response.text();
        } catch {
          backendErrorMessage = "No Error message returned from backen";
        }
        throw new Error(
          "Query: GetTodoById Non ok response: " + backendErrorMessage,
        );
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as TodoGetTodoByIdOutputType;
    },
    ...extraOptions,
  });
}

export type TodoCreateTodoOutputType = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};
export const TodoCreateTodoInputSchema = z
  .object({ title: z.string().min(1).max(200) })
  .strict();
export function useTodoCreateTodoMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      TodoCreateTodoOutputType,
      Error,
      z.infer<typeof TodoCreateTodoInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
  headers?: HeadersInit,
) {
  /*Creates a new todo item*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof TodoCreateTodoInputSchema>) => {
      const validationResult =
        await TodoCreateTodoInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on validating mutation input ",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api/Todo/CreateTodo", {
        method: "POST",
        body: JSON.stringify(validationResult.data),
        headers: headers,
      });

      if (!response.ok) {
        let backendErrorMessage = "";
        try {
          backendErrorMessage = await response.text();
        } catch {
          backendErrorMessage = "No Error message returned from backen";
        }
        throw new Error(
          "Mutation: CreateTodo Non ok response: " + backendErrorMessage,
        );
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as TodoCreateTodoOutputType;
    },
  });
}

export type TodoUpdateTodoOutputType = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};
export const TodoUpdateTodoInputSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1).max(200).optional(),
    completed: z.boolean().optional(),
  })
  .strict();
export function useTodoUpdateTodoMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      TodoUpdateTodoOutputType,
      Error,
      z.infer<typeof TodoUpdateTodoInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
  headers?: HeadersInit,
) {
  /*Updates an existing todo item*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof TodoUpdateTodoInputSchema>) => {
      const validationResult =
        await TodoUpdateTodoInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on validating mutation input ",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api/Todo/UpdateTodo", {
        method: "POST",
        body: JSON.stringify(validationResult.data),
        headers: headers,
      });

      if (!response.ok) {
        let backendErrorMessage = "";
        try {
          backendErrorMessage = await response.text();
        } catch {
          backendErrorMessage = "No Error message returned from backen";
        }
        throw new Error(
          "Mutation: UpdateTodo Non ok response: " + backendErrorMessage,
        );
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as TodoUpdateTodoOutputType;
    },
  });
}

export type TodoDeleteTodoOutputType = {
  success: boolean;
};
export const TodoDeleteTodoInputSchema = z.object({ id: z.string() }).strict();
export function useTodoDeleteTodoMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      TodoDeleteTodoOutputType,
      Error,
      z.infer<typeof TodoDeleteTodoInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
  headers?: HeadersInit,
) {
  /*Deletes a todo item by ID*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (args: z.infer<typeof TodoDeleteTodoInputSchema>) => {
      const validationResult =
        await TodoDeleteTodoInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on validating mutation input ",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api/Todo/DeleteTodo", {
        method: "POST",
        body: JSON.stringify(validationResult.data),
        headers: headers,
      });

      if (!response.ok) {
        let backendErrorMessage = "";
        try {
          backendErrorMessage = await response.text();
        } catch {
          backendErrorMessage = "No Error message returned from backen";
        }
        throw new Error(
          "Mutation: DeleteTodo Non ok response: " + backendErrorMessage,
        );
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as TodoDeleteTodoOutputType;
    },
  });
}

export const TodoWatchTodosSubscriptionInputSchema = z
  .object({ filter: z.enum(["all", "completed", "pending"]).optional() })
  .strict();
export type TodoWatchTodosOutputType = {
  event: "created" | "updated" | "deleted";
  todo?:
    | {
        id: string;
        title: string;
        completed: boolean;
        createdAt: string;
      }
    | undefined;
};

export function useTodoWatchTodosSubscription(
  args: z.infer<typeof TodoWatchTodosSubscriptionInputSchema>,
  extraOptions?: {
    onError?: (errorMessage: string) => void; // Callback that executes when there's an error
    onClose?: () => void; // Callback that executes when the connection has been closed by the server
  },
) {
  /*Streams real-time updates when todos are created, updated, or deleted*/
  const sourceRef = useRef<EventSource>();
  const [messages, setMessages] = useState<Array<TodoWatchTodosOutputType>>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const onErrorRef = useRef(extraOptions?.onError);
  const onCloseRef = useRef(extraOptions?.onClose);

  useEffect(() => {
    onErrorRef.current = extraOptions?.onError;
    onCloseRef.current = extraOptions?.onClose;
  }, [extraOptions]);
  useEffect(() => {
    if (sourceRef.current) {
      return;
    }

    const targetURL = new URL("/_api/Todo/WatchTodos", window.location.origin);
    const stringifiedArguments = JSON.stringify(args);
    const encodedArguments = encodeURIComponent(stringifiedArguments);
    targetURL.searchParams.set("payload", encodedArguments);

    const source = new EventSource(targetURL);
    sourceRef.current = source;

    source.addEventListener("open", () => {
      setIsConnected(true);
    });

    source.addEventListener("error", () => {
      if (onErrorRef.current) {
        onErrorRef.current("Failed to connect.");
      }
      setIsConnected(false);
    });

    source.addEventListener("content", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setMessages((prev) => [...prev, data]);
      } catch {
        if (onErrorRef.current) {
          onErrorRef.current("Failed to decode data");
        }
      }
    });

    source.addEventListener("close", () => {
      source.close();
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    });

    return () => {
      source.close();
      sourceRef.current = undefined;
      setIsConnected(false);
    };
  }, [args]);

  return {
    messages,
    isConnected,
  };
}

export const TodoCollaborateTodoBidirectionalInputSchema = z
  .object({
    action: z.enum(["edit", "complete", "delete"]),
    todoId: z.string(),
    data: z.any().optional(),
  })
  .strict();
export type TodoCollaborateTodoOutputType = {
  success: boolean;
  message: string;
  updatedTodo?:
    | {
        id: string;
        title: string;
        completed: boolean;
        createdAt: string;
      }
    | undefined;
};

export function useTodoCollaborateTodoBidirectional(
  options: UseWebSocketOptions = {},
): UseWebSocketReturn<
  z.infer<typeof TodoCollaborateTodoBidirectionalInputSchema>,
  TodoCollaborateTodoOutputType
> {
  /*Real-time bidirectional todo collaboration - send and receive todo updates*/

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const targetURL = new URL(
    `${protocol}//${window.location.host}/_api/Todo/CollaborateTodo`,
  );
  return useWebSocket<
    z.infer<typeof TodoCollaborateTodoBidirectionalInputSchema>,
    TodoCollaborateTodoOutputType
  >(targetURL.href, options);
}
//----
