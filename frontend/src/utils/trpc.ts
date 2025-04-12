import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "backend/src/router";

const client = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "http://localhost:3000/trpc",
			// You can pass any HTTP headers you wish here
		}),
	],
});
export { client };
