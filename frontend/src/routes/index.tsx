import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// QUERY examples
import {
  useTodoGetTodosQuery,
  useTodoGetTodoByIdQuery,
} from "@/_generated/todo.service";

// MUTATION examples
import {
  useTodoCreateTodoMutation,
  useTodoUpdateTodoMutation,
  useTodoDeleteTodoMutation,
} from "@/_generated/todo.service";

// SUBSCRIPTION example
import { useTodoWatchTodosSubscription } from "@/_generated/todo.service";

// BIDIRECTIONAL example
import { useTodoCollaborateTodoBidirectional } from "@/_generated/todo.service";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedTodoId, setSelectedTodoId] = useState("");
  const [collaborationTodoId, setCollaborationTodoId] = useState("");

  // ========== QUERY EXAMPLES ==========
  // Fetch all todos using QUERY method (GET request)
  const todosQuery = useTodoGetTodosQuery({
    limit: 10,
    offset: 0,
  });

  // Fetch a specific todo by ID using QUERY method (GET request)
  const todoByIdQuery = useTodoGetTodoByIdQuery(
    { id: selectedTodoId },
    { enabled: !!selectedTodoId }, // Only run when ID is provided
  );

  // ========== MUTATION EXAMPLES ==========
  // Create a new todo using MUTATION method (POST request)
  const createTodoMutation = useTodoCreateTodoMutation({
    onSuccess: () => {
      // Refetch todos after creating
      todosQuery.refetch();
      setNewTodoTitle("");
    },
  });

  // Update a todo using MUTATION method (POST request)
  const updateTodoMutation = useTodoUpdateTodoMutation({
    onSuccess: () => {
      todosQuery.refetch();
    },
  });

  // Delete a todo using MUTATION method (POST request)
  const deleteTodoMutation = useTodoDeleteTodoMutation({
    onSuccess: () => {
      todosQuery.refetch();
    },
  });

  // ========== SUBSCRIPTION EXAMPLE ==========
  // Watch for real-time todo updates using SUBSCRIPTION (Server-Sent Events)
  const { messages: todoEvents, isConnected: isSubscriptionConnected } =
    useTodoWatchTodosSubscription(
      { filter: "all" },
      {
        onError: (error) => console.error("Subscription error:", error),
        onClose: () => console.log("Subscription closed"),
      },
    );

  // ========== BIDIRECTIONAL EXAMPLE ==========
  // Real-time collaboration using BIDIRECTIONAL (WebSocket)
  const collaboration = useTodoCollaborateTodoBidirectional({
    connectOnMount: false,
    reconnect: true,
  });

  // Handlers
  const handleCreateTodo = () => {
    if (newTodoTitle.trim()) {
      createTodoMutation.mutate({ title: newTodoTitle });
    }
  };

  const handleToggleTodo = (todoId: string, completed: boolean) => {
    updateTodoMutation.mutate({
      id: todoId,
      completed: !completed,
    });
  };

  const handleDeleteTodo = (todoId: string) => {
    deleteTodoMutation.mutate({ id: todoId });
  };

  const handleCollaborativeEdit = (action: "edit" | "complete" | "delete") => {
    if (collaborationTodoId && collaboration.isConnected) {
      collaboration.sendMessage({
        action,
        todoId: collaborationTodoId,
        data: action === "edit" ? { title: "Edited via WebSocket" } : undefined,
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Zynapse - All Methods Example
        </h1>
        <p className="text-muted-foreground">
          Comprehensive demonstration of all 4 Zynapse method types
        </p>
      </div>

      {/* ========== QUERY SECTION ========== */}
      <section className="border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            📊 QUERY Methods (GET)
          </h2>
          <p className="text-sm text-muted-foreground">
            Read operations using GET requests
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">
            All Todos ({todosQuery.data?.total || 0})
          </h3>
          {todosQuery.isLoading && <p className="text-sm">Loading todos...</p>}
          {todosQuery.error && (
            <p className="text-sm text-red-500">
              Error: {todosQuery.error.message}
            </p>
          )}
          {todosQuery.data && (
            <ul className="space-y-2">
              {todosQuery.data.todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-accent"
                >
                  <span
                    className={
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }
                  >
                    {todo.title}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleTodo(todo.id, todo.completed)}
                    >
                      {todo.completed ? "Undo" : "Complete"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTodo(todo.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTodoId(todo.id)}
                    >
                      Details
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedTodoId && (
          <div className="p-4 rounded bg-accent">
            <h4 className="font-medium mb-2">Selected Todo Details:</h4>
            {todoByIdQuery.isLoading && <p className="text-sm">Loading...</p>}
            {todoByIdQuery.data && (
              <pre className="text-xs overflow-auto">
                {JSON.stringify(todoByIdQuery.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </section>

      {/* ========== MUTATION SECTION ========== */}
      <section className="border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            ✏️ MUTATION Methods (POST)
          </h2>
          <p className="text-sm text-muted-foreground">
            Write operations using POST requests
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="New todo title"
            className="flex-1"
          />
          <Button
            onClick={handleCreateTodo}
            disabled={createTodoMutation.isPending}
          >
            {createTodoMutation.isPending ? "Creating..." : "Create Todo"}
          </Button>
        </div>
        {createTodoMutation.error && (
          <p className="text-sm text-red-500">
            Error: {createTodoMutation.error.message}
          </p>
        )}
      </section>

      {/* ========== SUBSCRIPTION SECTION ========== */}
      <section className="border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            📡 SUBSCRIPTION Method (SSE)
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time updates from the server via Server-Sent Events
          </p>
        </div>

        <p className="text-sm">
          Status:{" "}
          <span
            className={
              isSubscriptionConnected ? "text-green-600" : "text-red-600"
            }
          >
            {isSubscriptionConnected ? "Connected ✓" : "Disconnected ✗"}
          </span>
        </p>

        <div>
          <h4 className="font-medium mb-2">
            Recent Events ({todoEvents.length}):
          </h4>
          <div className="max-h-48 overflow-y-auto bg-accent rounded p-4 space-y-2">
            {todoEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events yet. Create, update, or delete a todo to see events.
              </p>
            ) : (
              todoEvents
                .slice(-5)
                .reverse()
                .map((event, idx) => (
                  <div
                    key={idx}
                    className="border-b pb-2 last:border-0 text-sm"
                  >
                    <strong>Event:</strong> {event.event}
                    <br />
                    {event.todo && (
                      <>
                        <strong>Todo:</strong> {event.todo.title} (
                        {event.todo.completed ? "completed" : "pending"})
                      </>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* ========== BIDIRECTIONAL SECTION ========== */}
      <section className="border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            🔄 BIDIRECTIONAL Method (WebSocket)
          </h2>
          <p className="text-sm text-muted-foreground">
            Two-way real-time communication via WebSocket
          </p>
        </div>

        <p className="text-sm">
          WebSocket Status:{" "}
          <span
            className={
              collaboration.isConnected ? "text-green-600" : "text-red-600"
            }
          >
            {collaboration.isConnected ? "Connected ✓" : "Disconnected ✗"}
          </span>
        </p>

        {!collaboration.isConnected && (
          <Button onClick={collaboration.connect}>Connect WebSocket</Button>
        )}

        {collaboration.isConnected && (
          <div className="space-y-4">
            <Input
              type="text"
              value={collaborationTodoId}
              onChange={(e) => setCollaborationTodoId(e.target.value)}
              placeholder="Enter Todo ID"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleCollaborativeEdit("edit")}
                disabled={!collaborationTodoId}
                variant="outline"
              >
                Edit via WS
              </Button>
              <Button
                onClick={() => handleCollaborativeEdit("complete")}
                disabled={!collaborationTodoId}
                variant="outline"
              >
                Complete via WS
              </Button>
              <Button
                onClick={() => handleCollaborativeEdit("delete")}
                disabled={!collaborationTodoId}
                variant="outline"
              >
                Delete via WS
              </Button>
            </div>
            <Button onClick={collaboration.disconnect} variant="secondary">
              Disconnect
            </Button>
          </div>
        )}
      </section>

      {/* ========== SUMMARY ========== */}
      <section className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-950">
        <h2 className="text-2xl font-semibold mb-4">📚 Method Summary</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>QUERY (GET):</strong> Used for reading data. Examples:
            fetching todos list, getting a single todo by ID.
          </li>
          <li>
            <strong>MUTATION (POST):</strong> Used for writing data. Examples:
            creating, updating, and deleting todos.
          </li>
          <li>
            <strong>SUBSCRIPTION (SSE):</strong> Server pushes updates to
            client. Example: real-time notifications when todos change.
          </li>
          <li>
            <strong>BIDIRECTIONAL (WebSocket):</strong> Two-way communication.
            Example: collaborative editing with instant server responses.
          </li>
        </ul>
      </section>
    </div>
  );
}
