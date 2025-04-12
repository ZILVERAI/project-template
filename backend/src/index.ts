import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";

Bun.serve({
	port: 3000,
	reusePort: true,
	fetch(request) {
		// Only used for start-server-and-test package that
		// expects a 200 OK to start testing the server.
		if (request.method === "HEAD") {
			return new Response();
		}

		if (new URL(request.url).pathname === "/") {
			return new Response("hello world");
		}

		return fetchRequestHandler({
			endpoint: "/_api/trpc",
			req: request,
			router: appRouter,
			createContext: () => ({}),
		});
	},
});
console.log("Listening on 3000");
