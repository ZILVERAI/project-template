import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "backend/src/router";

const client = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "/_api/trpc",
			// You can pass any HTTP headers you wish here
		}),
	],
});
export { client };
